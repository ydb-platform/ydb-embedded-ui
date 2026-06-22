import {z} from 'zod';

import type {TopicFormValues} from '../../../store/reducers/topic/utils';
import {isValidEntityPath} from '../utils/pathSegmentValidation';

import i18n from './i18n';

const MIN_ONE_MESSAGE = i18n('error_min-number', {count: 1});
const MAX_HUNDRED_MESSAGE = i18n('error_max-number', {count: 100});

const addIssue = (ctx: z.RefinementCtx, path: Array<string | number>, message: string) => {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message,
    });
};

const requiredNumber = (schema?: z.ZodNumber) =>
    z.preprocess(
        (val) => (typeof val === 'number' && Number.isNaN(val) ? undefined : val),
        schema ??
            z.number({
                required_error: i18n('error_required'),
                invalid_type_error: i18n('error_number'),
            }),
    );

const optionalNumber = (schema?: z.ZodNumber) =>
    z.preprocess(
        (val) => (typeof val === 'number' && Number.isNaN(val) ? undefined : val),
        (
            schema ??
            z.number({
                invalid_type_error: i18n('error_number'),
            })
        ).optional(),
    );

const topicNameSchema = z
    .string({required_error: i18n('error_required'), invalid_type_error: i18n('error_required')})
    .min(1, i18n('error_required'))
    .superRefine((value, ctx) => {
        if (!isValidEntityPath(value)) {
            addIssue(ctx, [], i18n('error_name-regex'));
        }
    });

function validateRequiredNumber(
    ctx: z.RefinementCtx,
    path: Array<string | number>,
    value: number | undefined,
) {
    if (value === undefined) {
        addIssue(ctx, path, i18n('error_required'));
        return false;
    }

    return true;
}

export function getTopicFormValidationSchema(minPartitions: number) {
    return z
        .object({
            path: z.string().optional(),
            name: topicNameSchema,
            shards: requiredNumber(
                z
                    .number({
                        required_error: i18n('error_required'),
                        invalid_type_error: i18n('error_number'),
                    })
                    .min(1, MIN_ONE_MESSAGE),
            ),
            writeQuotaBytes: requiredNumber(),
            autoPartitioning: z.object({
                enabled: z.boolean(),
                mode: z.string().min(1, i18n('error_required')),
                minPartitions: optionalNumber(
                    z.number({invalid_type_error: i18n('error_number')}).min(1, MIN_ONE_MESSAGE),
                ),
                maxPartitions: optionalNumber(
                    z.number({invalid_type_error: i18n('error_number')}).min(1, MIN_ONE_MESSAGE),
                ),
                stabilizationWindow: optionalNumber(),
                upUtilization: optionalNumber(
                    z
                        .number({invalid_type_error: i18n('error_number')})
                        .max(100, MAX_HUNDRED_MESSAGE),
                ),
            }),
        })
        .superRefine((data, ctx) => {
            if (data.shards < minPartitions) {
                addIssue(ctx, ['shards'], i18n('error_min-number', {count: minPartitions}));
            }

            const {autoPartitioning} = data;

            if (!autoPartitioning.enabled) {
                return;
            }

            const minPath = ['autoPartitioning', 'minPartitions'];
            const maxPath = ['autoPartitioning', 'maxPartitions'];
            const stabilizationPath = ['autoPartitioning', 'stabilizationWindow'];
            const upUtilizationPath = ['autoPartitioning', 'upUtilization'];

            if (
                validateRequiredNumber(ctx, minPath, autoPartitioning.minPartitions) &&
                autoPartitioning.minPartitions !== undefined &&
                autoPartitioning.minPartitions < minPartitions
            ) {
                addIssue(ctx, minPath, i18n('error_min-number', {count: minPartitions}));
            }

            if (validateRequiredNumber(ctx, maxPath, autoPartitioning.maxPartitions)) {
                const minValue = autoPartitioning.minPartitions;
                if (
                    minValue !== undefined &&
                    autoPartitioning.maxPartitions !== undefined &&
                    autoPartitioning.maxPartitions <= minValue
                ) {
                    addIssue(ctx, maxPath, i18n('error_more-than-number', {count: minValue}));
                }
            }

            validateRequiredNumber(ctx, stabilizationPath, autoPartitioning.stabilizationWindow);

            validateRequiredNumber(ctx, upUtilizationPath, autoPartitioning.upUtilization);
        }) as z.ZodType<TopicFormValues>;
}
