import {isNil} from 'lodash';
import {z} from 'zod';

import type {BytesSizes} from '../../../../../../utils/bytesParsers';
import {sizes} from '../../../../../../utils/bytesParsers';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';

import type {ManagePartitioningValue} from './ManagePartitioningDialog';
import {DEFAULT_MANAGE_PARTITIONING_VALUE} from './constants';
import i18n from './i18n';

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
    return v in sizes;
}, i18n('error_invalid-unit'));

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
                    message: i18n('error_value-greater-maximum'),
                });
            }

            if (data.loadEnabled) {
                const p = data.loadPercent;
                if (isNil(p) || p <= 0 || p > 100) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['loadPercent'],
                        message: i18n('error_percent'),
                    });
                }
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

export function toFormValues(value: ManagePartitioningValue): ManagePartitioningFormValues {
    return {
        splitSize: Number(value.splitSize),
        splitUnit: value.splitUnit,
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
        loadPercent: String(data.loadPercent ?? ''),
        minimum: String(data.minimum),
        maximum: String(data.maximum),
    };
}
