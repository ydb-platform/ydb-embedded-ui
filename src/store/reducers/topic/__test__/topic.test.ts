import {configureStore} from '@reduxjs/toolkit';

import type {DescribeTopicResult} from '../../../../types/api/topic';
import {api} from '../../api';
import {selectTopicFormValues, topicApi} from '../topic';
import {AutoPartitioningStrategy} from '../utils';

describe('topic selectors', () => {
    const args = {
        path: '/Root/topic-a',
        database: '/Root',
        databaseFullPath: '/Root',
        useMetaProxy: false,
    };

    function createStore() {
        return configureStore({
            reducer: {
                [api.reducerPath]: api.reducer,
            },
            middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
        });
    }

    async function seedTopicResult(data: DescribeTopicResult) {
        const store = createStore();

        await store.dispatch(topicApi.util.upsertQueryData('getTopic', args, data));

        return selectTopicFormValues(
            store.getState() as never,
            args.path,
            args.database,
            args.databaseFullPath,
            args.useMetaProxy,
        );
    }

    test('selectTopicFormValues derives editable values for auto-partitioned topics', async () => {
        const result = await seedTopicResult({
            self: {name: 'topic-a'},
            retention_period: {seconds: '3600'},
            retention_storage_mb: '0',
            partition_write_speed_bytes_per_second: '262144',
            partitioning_settings: {
                min_active_partitions: '3',
                max_active_partitions: '8',
                auto_partitioning_settings: {
                    strategy: AutoPartitioningStrategy.ScaleUp,
                    partition_write_speed: {
                        stabilization_window: {seconds: '120'},
                        up_utilization_percent: 75,
                    },
                },
            },
        } as unknown as DescribeTopicResult);

        expect(result).toEqual({
            name: 'topic-a',
            shards: 3,
            partitionCountLimit: undefined,
            writeQuotaBytes: 262144,
            autoPartitioning: {
                enabled: true,
                mode: AutoPartitioningStrategy.ScaleUp,
                minPartitions: 3,
                maxPartitions: 8,
                stabilizationWindow: 120,
                upUtilization: 75,
            },
        });
    });

    test('selectTopicFormValues ignores backend retention fields for legacy topics', async () => {
        const result = await seedTopicResult({
            self: {name: 'topic-legacy'},
            retention_period: {seconds: '86400'},
            retention_storage_mb: '2048',
            partition_write_speed_bytes_per_second: '1048576',
            partitioning_settings: {
                min_active_partitions: '2',
                partition_count_limit: '5',
                auto_partitioning_settings: {
                    strategy: AutoPartitioningStrategy.Disabled,
                },
            },
        } as unknown as DescribeTopicResult);

        expect(result).toEqual({
            name: 'topic-legacy',
            shards: 2,
            partitionCountLimit: 5,
            writeQuotaBytes: 1048576,
            autoPartitioning: {
                enabled: false,
                mode: AutoPartitioningStrategy.Disabled,
                minPartitions: 2,
                maxPartitions: 5,
                stabilizationWindow: undefined,
                upUtilization: undefined,
            },
        });
    });

    test('selectTopicFormValues falls back for invalid numeric backend values', async () => {
        const result = await seedTopicResult({
            self: {name: 'topic-b'},
            retention_period: 'not-a-duration',
            retention_storage_mb: 'invalid',
            partition_write_speed_bytes_per_second: 'broken',
            partitioning_settings: {
                min_active_partitions: '1',
                partition_count_limit: 'oops',
                auto_partitioning_settings: {
                    strategy: AutoPartitioningStrategy.Unspecified,
                },
            },
        } as unknown as DescribeTopicResult);

        expect(result).toEqual({
            name: 'topic-b',
            shards: 1,
            partitionCountLimit: undefined,
            writeQuotaBytes: 1024 * 1024,
            autoPartitioning: {
                enabled: false,
                mode: AutoPartitioningStrategy.Unspecified,
                minPartitions: 1,
                maxPartitions: undefined,
                stabilizationWindow: undefined,
                upUtilization: undefined,
            },
        });
    });
});
