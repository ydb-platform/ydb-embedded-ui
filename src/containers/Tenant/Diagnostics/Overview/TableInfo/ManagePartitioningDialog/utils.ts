import {z} from 'zod';

import type {BytesSizes} from '../../../../../../utils/bytesParsers';
import {sizes} from '../../../../../../utils/bytesParsers';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';

import type {ManagePartitioningValue} from './ManagePartitioningDialog';
import {DEFAULT_MANAGE_PARTITIONING_VALUE} from './constants';

export type ManagePartitioningFormValues = {
    splitSize: number;
    splitUnit: BytesSizes;
    loadEnabled: boolean;
    loadPercent?: number;
    minimum: number;
    maximum: number;
};

export function getManagePartitioningInitialValues(
    initialData: Partial<ManagePartitioningValue> = {},
): ManagePartitioningValue {
    return {
        ...DEFAULT_MANAGE_PARTITIONING_VALUE,
        ...initialData,
    };
}

export const splitToBytes = (splitSize: number, splitUnit: BytesSizes) =>
    splitSize * sizes[splitUnit].value;

export const splitUnitSchema = z.custom<BytesSizes>((v) => {
    return typeof v === 'string' && v in sizes;
}, 'Invalid unit');

export const managePartitioningSchema = (
    maxSplitSizeBytes = DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES,
) =>
    z
        .object({
            splitSize: z.coerce.number().gt(0),
            splitUnit: splitUnitSchema,

            loadEnabled: z.boolean(),
            loadPercent: z.coerce.number().optional(),

            minimum: z.coerce.number().int().gt(0),
            maximum: z.coerce.number().int().gt(0),
        })
        .superRefine((data, ctx) => {
            const bytes = splitToBytes(data.splitSize, data.splitUnit);
            if (bytes > maxSplitSizeBytes) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['splitSize'],
                    message: 'Value is greater than maximum',
                });
            }

            if (data.loadEnabled) {
                const p = data.loadPercent;
                if (p === undefined || Number.isNaN(p)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['loadPercent'],
                        message: 'Must be a number',
                    });
                } else if (p <= 0 || p > 100) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['loadPercent'],
                        message: 'Must be between 0 and 100',
                    });
                }
            }

            if (data.minimum > data.maximum) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['minimum'],
                    message: 'Minimum must be ≤ Maximum',
                });
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['maximum'],
                    message: 'Maximum must be ≥ Minimum',
                });
            }
        });

export function toFormValues(value: ManagePartitioningValue): ManagePartitioningFormValues {
    return {
        splitSize: Number(value.splitSize),
        splitUnit: value.splitUnit as BytesSizes,
        loadEnabled: Boolean(value.loadEnabled),
        loadPercent: value.loadPercent === '' ? undefined : Number(value.loadPercent),
        minimum: Number(value.minimum),
        maximum: Number(value.maximum),
    };
}

export function toManagePartitioningValue(
    data: ManagePartitioningFormValues,
): ManagePartitioningValue {
    return {
        splitSize: String(data.splitSize),
        splitUnit: data.splitUnit,
        loadEnabled: data.loadEnabled,
        loadPercent: data.loadEnabled
            ? String(data.loadPercent ?? '')
            : String(data.loadPercent ?? ''),
        minimum: String(data.minimum),
        maximum: String(data.maximum),
    };
}
