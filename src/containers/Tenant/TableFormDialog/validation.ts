import {z} from 'zod';

import {isValidEntityPath, isValidEntityPathSegment} from '../utils/pathSegmentValidation';

import {isValueForTypeValid} from './columnValueValidation';
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
import {getAvailableTtlColumns, isValidTtlNumType} from './utils';

const UNIFORM_PARTITION_KEY_TYPES = new Set(['Uint32', 'Uint64']);

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

function isDefaultValueValid(value: string, type: string) {
    return isValueForTypeValid(value, type);
}

function validateColumnDefaults(data: FormValues, ctx: z.RefinementCtx, mode: FormMode) {
    if (mode !== 'create') {
        return;
    }

    data.columns.forEach((column, index) => {
        if (!column.withDefaultValue || column.key || column.autoincrement || !column.type) {
            return;
        }

        const value = column.defaultValue === undefined ? '' : String(column.defaultValue);

        if (!isDefaultValueValid(value, column.type)) {
            addIssue(ctx, ['columns', index, 'defaultValue'], i18n('error_value-invalid'));
        }
    });
}

function validateDuplicateColumns(
    data: FormValues,
    ctx: z.RefinementCtx,
    originalInfo?: OriginalTableInfo,
) {
    const existingColumns = new Set(originalInfo?.columns.map(({name}) => name) ?? []);

    data.deletedColumns.forEach(({name}) => existingColumns.delete(name));

    const duplicatedIndexes = new Set<number>();
    const newColumnsByName = new Map<string, number[]>();

    data.columns.forEach(({name}, index) => {
        if (!name) {
            return;
        }

        if (existingColumns.has(name)) {
            duplicatedIndexes.add(index);
        }

        const indexes = newColumnsByName.get(name);
        if (indexes) {
            indexes.push(index);
            duplicatedIndexes.add(index);
            indexes.forEach((duplicateIndex) => duplicatedIndexes.add(duplicateIndex));
            return;
        }

        newColumnsByName.set(name, [index]);
    });

    duplicatedIndexes.forEach((index) => {
        addIssue(ctx, ['columns', index, 'name'], i18n('error_column-name-duplicate'));
    });
}

function validatePrimaryKey(data: FormValues, ctx: z.RefinementCtx, mode: FormMode) {
    if (mode !== 'create' || data.columns.length === 0) {
        return;
    }

    if (!data.columns.some((column) => Boolean(column.key))) {
        addIssue(ctx, ['columns'], i18n('error_primary-key-required'));
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
    const duplicatedIndexes = new Set<number>();
    const indexNames = new Map<string, number[]>();

    data.secondaryIndexes.forEach((index, i) => {
        if (index.name) {
            if (ENTITY_NAME_REG_EXP.test(index.name)) {
                const indexes = indexNames.get(index.name);

                if (indexes) {
                    indexes.push(i);
                    duplicatedIndexes.add(i);
                    indexes.forEach((duplicateIndex) => duplicatedIndexes.add(duplicateIndex));
                } else {
                    indexNames.set(index.name, [i]);
                }
            } else {
                addIssue(ctx, ['secondaryIndexes', i, 'name'], i18n('error_name-pattern'));
            }
        } else {
            addIssue(ctx, ['secondaryIndexes', i, 'name'], i18n('error_required'));
        }

        if (!index.key || index.key.length === 0) {
            addIssue(ctx, ['secondaryIndexes', i, 'key'], i18n('error_required'));
        } else if (!index.key.every((column: string) => allColumns.has(column))) {
            addIssue(ctx, ['secondaryIndexes', i, 'key'], i18n('error_indexes-key'));
        }
    });

    duplicatedIndexes.forEach((index) => {
        addIssue(ctx, ['secondaryIndexes', index, 'name'], i18n('error_index-name-duplicate'));
    });

    const originalIndexedColumns = new Set(
        originalInfo?.indexes.flatMap((index) => index.columns) ?? [],
    );

    if (data.deletedColumns.some((column) => originalIndexedColumns.has(column.name))) {
        addIssue(ctx, ['columns'], i18n('error_indexes-delete-column'));
    }
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

function validateTtl(data: FormValues, ctx: z.RefinementCtx, originalInfo?: OriginalTableInfo) {
    const ttl = data.settings?.ttl;
    if (!ttl || ttl.status === 'disabled') {
        return;
    }

    const selectedTtlColumn = getAvailableTtlColumns(
        originalInfo?.columns,
        data.columns,
        data.deletedColumns,
    ).find(({name}) => name === ttl.column);

    if (!ttl.column) {
        addIssue(ctx, ['settings', 'ttl', 'column'], i18n('error_required'));
    }
    if (ttl.column && !selectedTtlColumn) {
        addIssue(ctx, ['settings', 'ttl', 'column'], i18n('error_ttl-column-invalid'));
    }
    if (selectedTtlColumn && isValidTtlNumType(selectedTtlColumn.type) && !ttl.epochMode) {
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
    const pkColumns = data.columns.filter(({key}) => Boolean(key));
    const pkColumnCount = pkColumns.length;

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
        return;
    }

    const matchesCurrentPrimaryKey = partitionsAtKeys.every((point) => {
        const currentColumns = point.length === 1 ? pkColumns.slice(0, 1) : pkColumns;

        return point.every((column, index) => {
            const currentColumn = currentColumns[index];

            return (
                Boolean(currentColumn) &&
                Boolean(column.value) &&
                column.name === currentColumn.name &&
                column.type === currentColumn.type &&
                isValueForTypeValid(String(column.value), currentColumn.type)
            );
        });
    });

    if (!matchesCurrentPrimaryKey) {
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

function validateAutoPartitionRange(data: FormValues, ctx: z.RefinementCtx) {
    const {autoPartitionMinPartitions, autoPartitionMaxPartitions} = data.settings;

    if (
        typeof autoPartitionMinPartitions !== 'number' ||
        Number.isNaN(autoPartitionMinPartitions) ||
        typeof autoPartitionMaxPartitions !== 'number' ||
        Number.isNaN(autoPartitionMaxPartitions)
    ) {
        return;
    }

    if (autoPartitionMinPartitions > autoPartitionMaxPartitions) {
        addIssue(
            ctx,
            ['settings', 'autoPartitionMinPartitions'],
            i18n('error_minimum-greater-maximum'),
        );
        addIssue(
            ctx,
            ['settings', 'autoPartitionMaxPartitions'],
            i18n('error_maximum-less-minimum'),
        );
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
            const firstKeyColumn = data.columns.find((column) => Boolean(column.key));

            if (settings.uniformPartitions === undefined || Number.isNaN(value)) {
                addIssue(ctx, ['settings', 'uniformPartitions'], i18n('error_required'));
            } else if (value < MIN_PARTITIONS_COUNT || value > MAX_PARTITIONS_COUNT) {
                addIssue(ctx, ['settings', 'uniformPartitions'], i18n('error_partitions-count'));
            } else if (!firstKeyColumn || !UNIFORM_PARTITION_KEY_TYPES.has(firstKeyColumn.type)) {
                addIssue(
                    ctx,
                    ['settings', 'uniformPartitions'],
                    i18n('error_uniform-partitions-first-key-type'),
                );
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

    validateAutoPartitionRange(data, ctx);
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
        validateTtl(data, ctx, originalInfo);
        return;
    }

    validateRowSettings(data, ctx, mode, originalInfo);

    validateTtl(data, ctx, originalInfo);
}

export function buildTableValidationSchema({
    mode,
    originalInfo,
}: SchemaContext): z.ZodType<FormValues, FormValues> {
    return baseSchema.superRefine((raw, ctx) => {
        const data = raw as FormValues;
        validateName(data, ctx, mode);
        validateColumns(data, ctx, mode);
        validateColumnDefaults(data, ctx, mode);
        validateDuplicateColumns(data, ctx, originalInfo);
        validatePrimaryKey(data, ctx, mode);
        validateSecondaryIndexes(data, ctx, originalInfo);
        validatePartitioning(data, ctx, mode);
        validateSettings(data, ctx, mode, originalInfo);
    }) as z.ZodType<FormValues, FormValues>;
}
