import {z} from 'zod';

import {isValidEntityPath, isValidEntityPathSegment} from '../utils/pathSegmentValidation';

import {
    COLUMN_NAME_REG_EXP,
    ENTITY_NAME_REG_EXP,
    MAX_COLUMN_PARTITION_COUNT,
    MAX_PARTITIONS_COUNT,
    MAX_PARTITION_SIZE_MB,
    MIN_COLUMN_PARTITION_COUNT,
    MIN_PARTITIONS_COUNT,
    MIN_PARTITION_SIZE_MB,
} from './constants';
import i18n from './i18n';
import type {FormMode, FormValues, OriginalTableInfo} from './types';
import {PartitionsType} from './types';

const addIssue = (ctx: z.RefinementCtx, path: Array<string | number>, message: string) => {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message,
    });
};

const baseSchema = z
    .object({
        name: z.string(),
        type: z.union([z.literal('row'), z.literal('column')]),
        columns: z.array(z.any()),
        secondaryIndexes: z.array(z.any()),
        deletedColumns: z.array(z.any()),
        partitionKey: z.array(z.string()),
        partitionCount: z.number().or(z.nan()).optional(),
        settings: z.any(),
    })
    .passthrough();

interface SchemaContext {
    mode: FormMode;
    originalInfo?: OriginalTableInfo;
}

function validateName(data: FormValues, ctx: z.RefinementCtx, mode: FormMode) {
    if (!data.name) {
        addIssue(ctx, ['name'], i18n('error_required'));
        return;
    }

    const hasPathSegments = mode === 'create' || data.type === 'row';
    const isValidName = hasPathSegments
        ? isValidEntityPath(data.name, {
              allowLeadingSlash: mode === 'update' && data.type === 'row',
          })
        : isValidEntityPathSegment(data.name);

    if (!isValidName) {
        addIssue(
            ctx,
            ['name'],
            hasPathSegments ? i18n('error_name-path-pattern') : i18n('error_name-segment-pattern'),
        );
    }
}

function validateColumns(data: FormValues, ctx: z.RefinementCtx, mode: FormMode) {
    if (data.type !== 'row' && data.type !== 'column') {
        return;
    }
    data.columns.forEach((column, index) => {
        if (!column.name) {
            addIssue(ctx, ['columns', index, 'name'], i18n('error_required'));
        } else if (!COLUMN_NAME_REG_EXP.test(column.name)) {
            addIssue(ctx, ['columns', index, 'name'], i18n('error_column-name-pattern'));
        }
        if (!column.type) {
            addIssue(ctx, ['columns', index, 'type'], i18n('error_required'));
        }
    });
    if (mode === 'create' && data.columns.length === 0) {
        addIssue(ctx, ['columns'], i18n('error_columns-empty'));
    }
}

function validateSecondaryIndexes(
    data: FormValues,
    ctx: z.RefinementCtx,
    originalInfo?: OriginalTableInfo,
) {
    if (data.type !== 'row') {
        return;
    }
    const allColumns = new Set<string>([
        ...(originalInfo?.columns.map(({name}) => name) ?? []),
        ...data.columns.map(({name}) => name),
    ]);
    data.deletedColumns.forEach((column) => allColumns.delete(column.name));

    data.secondaryIndexes.forEach((index, i) => {
        if (!index.name) {
            addIssue(ctx, ['secondaryIndexes', i, 'name'], i18n('error_required'));
        } else if (!ENTITY_NAME_REG_EXP.test(index.name)) {
            addIssue(ctx, ['secondaryIndexes', i, 'name'], i18n('error_name-pattern'));
        }
        if (!index.key || index.key.length === 0) {
            addIssue(ctx, ['secondaryIndexes', i, 'key'], i18n('error_required'));
        } else if (!index.key.every((column: string) => allColumns.has(column))) {
            addIssue(ctx, ['secondaryIndexes', i, 'key'], i18n('error_indexes-key'));
        }
    });
}

function validatePartitioning(data: FormValues, ctx: z.RefinementCtx, mode: FormMode) {
    if (data.type !== 'column' || mode !== 'create') {
        return;
    }
    if (!data.partitionKey || data.partitionKey.length === 0) {
        addIssue(ctx, ['partitionKey'], i18n('error_required'));
    }
    const count = Number(data.partitionCount);
    if (
        !Number.isFinite(count) ||
        count < MIN_COLUMN_PARTITION_COUNT ||
        count > MAX_COLUMN_PARTITION_COUNT
    ) {
        addIssue(ctx, ['partitionCount'], i18n('error_partition-count-range'));
    }
}

function validateTtl(data: FormValues, ctx: z.RefinementCtx) {
    const ttl = data.settings?.ttl;
    if (!ttl || ttl.status === 'disabled') {
        return;
    }
    if (!ttl.column) {
        addIssue(ctx, ['settings', 'ttl', 'column'], i18n('error_required'));
    }
    if (ttl.columnWithEpochMode && !ttl.epochMode) {
        addIssue(ctx, ['settings', 'ttl', 'epochMode'], i18n('error_required'));
    }
    if (ttl.lifetime === undefined || ttl.lifetime === null || Number.isNaN(ttl.lifetime)) {
        addIssue(ctx, ['settings', 'ttl', 'lifetime'], i18n('error_required'));
    }
}

function validatePartitionsAtKeys(data: FormValues, ctx: z.RefinementCtx) {
    const settings = data.settings;
    if (!settings || settings.partitionsType !== PartitionsType.Explicit) {
        return;
    }
    const partitionsAtKeys = settings.partitionsAtKeys;
    if (!partitionsAtKeys || partitionsAtKeys.length === 0) {
        return;
    }
    const pkColumnCount = data.columns.filter(({key}) => Boolean(key)).length;

    const allHaveLengthOne = partitionsAtKeys.every(
        (point: Array<{value: string | null}>) =>
            point.length === 1 && point.every((p) => Boolean(p.value)),
    );
    const allHaveLengthPk = partitionsAtKeys.every(
        (point: Array<{value: string | null}>) =>
            point.length === pkColumnCount && point.every((p) => Boolean(p.value)),
    );
    if (!allHaveLengthOne && !allHaveLengthPk) {
        addIssue(ctx, ['settings', 'partitionsAtKeys'], i18n('error_partitions-at-keys-invalid'));
    }
}

function validateOptionalPartitionsCount(
    ctx: z.RefinementCtx,
    path: 'autoPartitionMinPartitions' | 'autoPartitionMaxPartitions',
    value: number | undefined,
    isRequired: boolean | undefined,
) {
    if (!isRequired && value === undefined) {
        return;
    }

    if (value === undefined) {
        addIssue(ctx, ['settings', path], i18n('error_required'));
        return;
    }

    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue)) {
        if (isRequired) {
            addIssue(ctx, ['settings', path], i18n('error_required'));
        }
        return;
    }

    if (parsedValue < MIN_PARTITIONS_COUNT || parsedValue > MAX_PARTITIONS_COUNT) {
        addIssue(ctx, ['settings', path], i18n('error_partitions-count'));
    }
}

function validateRowSettings(
    data: FormValues,
    ctx: z.RefinementCtx,
    mode: FormMode,
    originalInfo?: OriginalTableInfo,
) {
    const settings = data.settings;
    if (!settings) {
        return;
    }

    if (mode === 'create') {
        if (settings.partitionsType === PartitionsType.Uniform) {
            const value = Number(settings.uniformPartitions);
            if (settings.uniformPartitions === undefined || Number.isNaN(value)) {
                addIssue(ctx, ['settings', 'uniformPartitions'], i18n('error_required'));
            } else if (value < MIN_PARTITIONS_COUNT || value > MAX_PARTITIONS_COUNT) {
                addIssue(ctx, ['settings', 'uniformPartitions'], i18n('error_partitions-count'));
            }
        }

        validatePartitionsAtKeys(data, ctx);
    }

    if (settings.autoPartitionBySize && settings.autoPartitionBySizeMb !== undefined) {
        const value = Number(settings.autoPartitionBySizeMb);
        if (Number.isNaN(value)) {
            addIssue(ctx, ['settings', 'autoPartitionBySizeMb'], i18n('error_required'));
        } else if (value < MIN_PARTITION_SIZE_MB || value > MAX_PARTITION_SIZE_MB) {
            addIssue(ctx, ['settings', 'autoPartitionBySizeMb'], i18n('error_partition-size'));
        }
    }

    validateOptionalPartitionsCount(
        ctx,
        'autoPartitionMinPartitions',
        settings.autoPartitionMinPartitions,
        originalInfo?.hasMinPartitions,
    );
    validateOptionalPartitionsCount(
        ctx,
        'autoPartitionMaxPartitions',
        settings.autoPartitionMaxPartitions,
        originalInfo?.hasMaxPartitions,
    );
}

function validateSettings(
    data: FormValues,
    ctx: z.RefinementCtx,
    mode: FormMode,
    originalInfo?: OriginalTableInfo,
) {
    const settings = data.settings;
    if (!settings) {
        return;
    }

    if (data.type !== 'row') {
        validateTtl(data, ctx);
        return;
    }

    validateRowSettings(data, ctx, mode, originalInfo);

    validateTtl(data, ctx);
}

export function buildTableValidationSchema({
    mode,
    originalInfo,
}: SchemaContext): z.ZodType<FormValues> {
    return baseSchema.superRefine((raw, ctx) => {
        const data = raw as FormValues;
        validateName(data, ctx, mode);
        validateColumns(data, ctx, mode);
        validateSecondaryIndexes(data, ctx, originalInfo);
        validatePartitioning(data, ctx, mode);
        validateSettings(data, ctx, mode, originalInfo);
    }) as z.ZodType<FormValues>;
}
