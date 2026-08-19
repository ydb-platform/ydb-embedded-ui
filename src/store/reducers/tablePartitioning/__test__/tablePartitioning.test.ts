import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import {api} from '../../api';
import {tablePartitioningApi} from '../tablePartitioning';

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

describe('tablePartitioningApi', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('disables size partitioning without changing the partition size', async () => {
        const sendQuery = jest.fn().mockResolvedValue({});
        window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const result = await store.dispatch(
            tablePartitioningApi.endpoints.updateTablePartitioning.initiate({
                database: '/Root',
                path: '/Root/table`name',
                value: {
                    splitBySize: false,
                    minPartitions: 5,
                    maxPartitions: 50,
                    splitByLoad: false,
                },
            }),
        );

        expect(result).toMatchObject({data: null});

        const request = sendQuery.mock.calls[0][0] as {query: string; database: string};

        expect(request.database).toBe('/Root');
        expect(request.query).toContain('ALTER TABLE `/Root/table``name` SET');
        expect(request.query).toContain('AUTO_PARTITIONING_BY_SIZE = DISABLED');
        expect(request.query).not.toContain('AUTO_PARTITIONING_PARTITION_SIZE_MB');
        expect(request.query).toContain('AUTO_PARTITIONING_MIN_PARTITIONS_COUNT = 5');
        expect(request.query).toContain('AUTO_PARTITIONING_MAX_PARTITIONS_COUNT = 50');
        expect(request.query).toContain('AUTO_PARTITIONING_BY_LOAD = DISABLED');
    });

    test('enables size partitioning with its partition size', async () => {
        const sendQuery = jest.fn().mockResolvedValue({});
        window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        await store.dispatch(
            tablePartitioningApi.endpoints.updateTablePartitioning.initiate({
                database: '/Root',
                path: '/Root/table',
                value: {
                    splitBySize: true,
                    partitionSizeMb: 2048,
                    minPartitions: 4,
                    maxPartitions: 100,
                    splitByLoad: true,
                },
            }),
        );

        const request = sendQuery.mock.calls[0][0] as {query: string};

        expect(request.query).toContain('AUTO_PARTITIONING_BY_SIZE = ENABLED');
        expect(request.query).toContain('AUTO_PARTITIONING_PARTITION_SIZE_MB = 2048');
        expect(request.query).toContain('AUTO_PARTITIONING_BY_LOAD = ENABLED');
    });
});
