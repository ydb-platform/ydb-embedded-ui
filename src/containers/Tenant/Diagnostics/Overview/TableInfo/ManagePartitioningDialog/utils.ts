import {z} from 'zod';

import type {BytesSizes} from '../../../../../../utils/bytesParsers';
import {convertToBytes, sizes} from '../../../../../../utils/bytesParsers';
import {GIGABYTE} from '../../../../../../utils/constants';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';

import {DEFAULT_MANAGE_PARTITIONING_VALUE} from './constants';
import i18n from './i18n';
import type {ManagePartitioningFormState} from './types';

export function splitToPartitionSizeMb(splitSize: number, splitUnit: BytesSizes) {
    const bytes = convertToBytes(splitSize, splitUnit);
    const partitionSizeMb = Math.round(bytes / sizes.mb.value);
    return {bytes, partitionSizeMb};
}

export function getManagePartitioningInitialValues(
    initialData: Partial<ManagePartitioningFormState> = {},
): ManagePartitioningFormState {
    return {
        ...DEFAULT_MANAGE_PARTITIONING_VALUE,
        ...initialData,
    };
}

/**
 * Extracts the maximum allowed split size (in bytes) from the database config.
 *
 * Reads `ImmediateControlsConfig.SchemeShardControls.ForceShardSplitDataSize`
 * (forces shards to split when reaching the given data size). Falls back to
 * the default 2 GiB when the field is missing or invalid.
 */
function getNestedRecord(
    source: Record<string, unknown> | undefined,
    key: string,
): Record<string, unknown> | undefined {
    const value = source?.[key];

    if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>;
    }

    return undefined;
}

export function getMaxSplitSizeBytes(config?: Record<string, unknown>): number {
    const immediateControlsConfig = getNestedRecord(config, 'ImmediateControlsConfig');
    const schemeShardControls = getNestedRecord(immediateControlsConfig, 'SchemeShardControls');
    const forceShardSplitDataSize = schemeShardControls?.ForceShardSplitDataSize;

    if (
        typeof forceShardSplitDataSize === 'number' ||
        typeof forceShardSplitDataSize === 'string'
    ) {
        const parsed = Number(forceShardSplitDataSize);

        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
    }

    return DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES;
}

const MAX_SPLIT_SIZE_GB_PRECISION = 1;

/**
 * Returns the maximum split size in GB for display in the hint.
 *
 * The value is floored (not rounded) to {@link MAX_SPLIT_SIZE_GB_PRECISION}
 * decimals so that converting it back to bytes never exceeds
 * `maxSplitSizeBytes`. This keeps the displayed maximum consistent with the
 * exact byte limit used by validation: e.g. for a 2.5 GiB limit
 * (2 684 354 560 bytes ≈ 2.684 GB) the hint shows `2.6`, which passes
 * validation, instead of the rounded `3` that the validator rejects.
 */
export function getMaxSplitSizeGb(maxSplitSizeBytes: number): string {
    const factor = 10 ** MAX_SPLIT_SIZE_GB_PRECISION;
    const flooredGb = Math.floor((maxSplitSizeBytes / GIGABYTE) * factor) / factor;

    return String(flooredGb);
}

export const splitUnitSchema = z.custom<BytesSizes>((value) => {
    return typeof value === 'string' && value in sizes;
}, i18n('error_invalid-unit'));

const requiredStringValue = (requiredMessage: string) => z.string().min(1, requiredMessage);

// Required positive number (> 0)
const requiredPositiveNumber = (requiredMessage: string) =>
    requiredStringValue(requiredMessage).pipe(
        z.coerce.number<string>({error: requiredMessage}).gt(0),
    );

// Required positive integer (> 0)
const requiredPositiveInt = (requiredMessage: string) =>
    requiredStringValue(requiredMessage).pipe(
        z.coerce.number<string>({error: requiredMessage}).int().gt(0),
    );

export const managePartitioningSchema = (
    maxSplitSizeBytes = DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES,
) =>
    z
        .object({
            splitSize: requiredPositiveNumber(i18n('error_required')),
            splitUnit: splitUnitSchema,

            loadEnabled: z.boolean(),

            minimum: requiredPositiveInt(i18n('error_required')),
            maximum: requiredPositiveInt(i18n('error_required')),
        })
        .superRefine((data, ctx) => {
            const {bytes, partitionSizeMb} = splitToPartitionSizeMb(data.splitSize, data.splitUnit);

            if (bytes > maxSplitSizeBytes) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['splitSize'],
                    message: i18n('error_value-greater-maximum'),
                });
            }

            if (partitionSizeMb < 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['splitSize'],
                    message: i18n('error_value-too-small'),
                });
            }

            if (data.minimum > data.maximum) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['minimum'],
                    message: i18n('error_minimum-greater-maximum'),
                });
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['maximum'],
                    message: i18n('error_maximum-less-minimum'),
                });
            }
        });
