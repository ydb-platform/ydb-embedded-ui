import {z} from 'zod';

import type {BytesSizes} from '../../../../../../utils/bytesParsers';
import {convertToBytes, sizes} from '../../../../../../utils/bytesParsers';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';

import {DEFAULT_MANAGE_PARTITIONING_VALUE} from './constants';
import i18n from './i18n';
import type {ManagePartitioningFormOutput, ManagePartitioningFormState} from './types';

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
): z.ZodType<ManagePartitioningFormOutput, ManagePartitioningFormState> =>
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
