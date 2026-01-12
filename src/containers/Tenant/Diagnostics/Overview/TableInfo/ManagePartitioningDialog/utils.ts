import {z} from 'zod';

import type {BytesSizes} from '../../../../../../utils/bytesParsers';
import {sizes} from '../../../../../../utils/bytesParsers';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';

import {DEFAULT_MANAGE_PARTITIONING_VALUE} from './constants';
import i18n from './i18n';
import type {ManagePartitioningFormState} from './types';

export function getManagePartitioningInitialValues(
    initialData: Partial<ManagePartitioningFormState> = {},
): ManagePartitioningFormState {
    return {
        ...DEFAULT_MANAGE_PARTITIONING_VALUE,
        ...initialData,
    };
}

export const splitToBytes = (splitSize: number, splitUnit: BytesSizes) =>
    splitSize * sizes[splitUnit].value;

export const splitUnitSchema = z.custom<BytesSizes>((value) => {
    return value in sizes;
}, i18n('error_invalid-unit'));

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

// Required positive number (> 0)
const requiredPositiveNumber = (requiredMessage: string) =>
    z.preprocess(
        emptyToUndefined,
        z.coerce
            .number({
                required_error: requiredMessage,
                invalid_type_error: requiredMessage,
            })
            .gt(0),
    );

// Required positive integer (> 0)
const requiredPositiveInt = (requiredMessage: string) =>
    z.preprocess(
        emptyToUndefined,
        z.coerce
            .number({
                required_error: requiredMessage,
                invalid_type_error: requiredMessage,
            })
            .int()
            .gt(0),
    );

// Optional number (empty -> undefined)
const optionalNumber = () => z.preprocess(emptyToUndefined, z.coerce.number().optional());

export const managePartitioningSchema = (
    maxSplitSizeBytes = DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES,
) =>
    z
        .object({
            splitSize: requiredPositiveNumber(i18n('error_required')),
            splitUnit: splitUnitSchema,

            loadEnabled: z.boolean(),
            loadPercent: optionalNumber(),

            minimum: requiredPositiveInt(i18n('error_required')),
            maximum: requiredPositiveInt(i18n('error_required')),
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
                if (p === undefined) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['loadPercent'],
                        message: i18n('error_required'),
                    });
                } else if (p <= 0 || p > 100) {
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
