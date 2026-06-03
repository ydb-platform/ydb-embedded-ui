import {AutoPartitioningStrategy} from '../../../../store/reducers/topic/utils';
import type {TopicFormValues} from '../../../../store/reducers/topic/utils';
import {getTopicFormValidationSchema} from '../validation';

describe('TopicFormDialog validation', () => {
    function createValidValues(overrides: Partial<TopicFormValues> = {}): TopicFormValues {
        return {
            path: 'folder',
            name: 'topic',
            shards: 2,
            writeQuotaBytes: 128 * 1024,
            retentionPeriodSeconds: 4 * 60 * 60,
            storageLimitMb: 50 * 1024,
            retentionType: 'time',
            autoPartitioning: {
                enabled: false,
                mode: AutoPartitioningStrategy.ScaleUp,
                minPartitions: 2,
                maxPartitions: 4,
                stabilizationWindow: 300,
                upUtilization: 90,
            },
            ...overrides,
        };
    }

    function getIssuePaths(
        result: ReturnType<ReturnType<typeof getTopicFormValidationSchema>['safeParse']>,
    ) {
        if (result.success) {
            return [];
        }

        return result.error.issues.map(({path}) => path.join('.'));
    }

    test('rejects topic names with empty path segments', () => {
        const schema = getTopicFormValidationSchema(2);

        const result = schema.safeParse(createValidValues({name: 'folder//topic'}));

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('name');
    });

    test('accepts uppercase topic names', () => {
        const schema = getTopicFormValidationSchema(2);

        const result = schema.safeParse(createValidValues({name: 'Folder/Topic'}));

        expect(result.success).toBe(true);
    });

    test('requires size retention value when size retention is selected', () => {
        const schema = getTopicFormValidationSchema(2);

        const result = schema.safeParse(
            createValidValues({
                retentionType: 'size',
                storageLimitMb: Number.NaN,
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('storageLimitMb');
    });

    test('requires time retention value when time retention is selected', () => {
        const schema = getTopicFormValidationSchema(2);

        const result = schema.safeParse(
            createValidValues({
                retentionPeriodSeconds: Number.NaN,
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('retentionPeriodSeconds');
    });

    test('validates auto-partitioning bounds and required fields', () => {
        const schema = getTopicFormValidationSchema(3);

        const result = schema.safeParse(
            createValidValues({
                shards: 2,
                autoPartitioning: {
                    enabled: true,
                    mode: AutoPartitioningStrategy.ScaleUp,
                    minPartitions: 2,
                    maxPartitions: 2,
                    stabilizationWindow: undefined,
                    upUtilization: undefined,
                },
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toEqual(
            expect.arrayContaining([
                'shards',
                'autoPartitioning.minPartitions',
                'autoPartitioning.maxPartitions',
                'autoPartitioning.stabilizationWindow',
                'autoPartitioning.upUtilization',
            ]),
        );
    });
});
