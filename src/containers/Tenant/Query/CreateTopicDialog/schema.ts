import {z} from 'zod';

import type {CreateTopicParams} from '../../../../store/reducers/createTopic/createTopic';

import {DEFAULT_METER_MODE} from './constants';
import i18n from './i18n';

const positiveIntFromMaybeNull = z
    .number({invalid_type_error: i18n('error_required')})
    .int(i18n('error_positive-int'))
    .positive(i18n('error_positive-int'));

const autoPartitioningSchema = z.object({
    enabled: z.boolean(),
    mode: z.enum(['scale-up', 'paused', 'scale-up-and-down']),
    minPartitions: positiveIntFromMaybeNull,
    maxPartitions: positiveIntFromMaybeNull,
    stabilizationWindow: z
        .number({invalid_type_error: i18n('error_required')})
        .int()
        .min(1, i18n('error_positive-int')),
    upUtilization: z
        .number({invalid_type_error: i18n('error_required')})
        .int()
        .min(1, i18n('error_positive-int'))
        .max(100, i18n('error_positive-int')),
    downUtilization: z.number().int().min(0).max(99),
});

export const createTopicFormSchema = z
    .object({
        name: z
            .string({required_error: i18n('error_required')})
            .min(2, i18n('error_name-min', {min: 2})),
        shards: positiveIntFromMaybeNull,
        writeQuota: z.number(),
        retentionType: z.enum(['time', 'size']),
        retentionHours: z.number(),
        storageLimitMb: z.number(),
        autoPartitioning: autoPartitioningSchema,
    })
    .superRefine((data, ctx) => {
        if (data.retentionType === 'time' && data.retentionHours === 1 && data.writeQuota !== 128) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['retentionHours'],
                message: i18n('label_retention-unavailable', {
                    speed: i18n('unit_kb-per-second', {value: 128}),
                }),
            });
        }

        if (data.autoPartitioning.enabled) {
            if (data.autoPartitioning.maxPartitions <= data.autoPartitioning.minPartitions) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['autoPartitioning', 'minPartitions'],
                    message: i18n('error_min-greater-max'),
                });
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['autoPartitioning', 'maxPartitions'],
                    message: i18n('error_max-less-min'),
                });
            }
        }
    });

export type CreateTopicFormValues = z.infer<typeof createTopicFormSchema>;

export function prepareCreateTopicPayload(
    values: CreateTopicFormValues,
    database: string,
): CreateTopicParams {
    const {autoPartitioning} = values;

    return {
        database,
        name: values.name,
        shards: autoPartitioning.enabled ? autoPartitioning.minPartitions : values.shards,
        writeQuota: values.writeQuota,
        retentionHours: values.retentionHours,
        storageLimitMb: values.storageLimitMb,
        meterMode: DEFAULT_METER_MODE,
        retentionType: values.retentionType,
        autoPartitioning: autoPartitioning.enabled
            ? {
                  enabled: true,
                  mode: autoPartitioning.mode,
                  minPartitions: autoPartitioning.minPartitions,
                  maxPartitions: autoPartitioning.maxPartitions,
                  stabilizationWindow: autoPartitioning.stabilizationWindow,
                  upUtilization: autoPartitioning.upUtilization,
              }
            : {
                  enabled: false,
                  mode: autoPartitioning.mode,
              },
    };
}
