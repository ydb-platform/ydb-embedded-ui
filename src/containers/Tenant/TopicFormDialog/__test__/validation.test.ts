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

        const result = schema.safeParse(createValidValues({name: 'Folder.v1/Topic-name_2'}));

        expect(result.success).toBe(true);
    });

    test('rejects topic names with path segments longer than 255 characters', () => {
        const schema = getTopicFormValidationSchema(2);

        const result = schema.safeParse(createValidValues({name: `${'a'.repeat(256)}/topic`}));

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('name');
    });

    test('allows equal auto-partitioning bounds', () => {
        const schema = getTopicFormValidationSchema(3);

        const result = schema.safeParse(
            createValidValues({
                shards: 3,
                autoPartitioning: {
                    enabled: true,
                    mode: AutoPartitioningStrategy.ScaleUp,
                    minPartitions: 3,
                    maxPartitions: 3,
                    stabilizationWindow: 300,
                    upUtilization: 90,
                },
            }),
        );

        expect(result.success).toBe(true);
    });

    test('validates auto-partitioning minimum and required fields', () => {
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
                'autoPartitioning.stabilizationWindow',
                'autoPartitioning.upUtilization',
            ]),
        );
    });
});
