import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import * as metrica from '../../../../utils/yaMetrica';
import {api} from '../../api';
import {topicApi} from '../topic';
import {AutoPartitioningStrategy} from '../utils';

describe('topic creation with an unavailable metrics counter', () => {
    const originalApi = window.api;
    const store = configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });

    beforeEach(() => {
        jest.spyOn(metrica, 'reachMetricaGoal').mockImplementation(() => {
            throw new Error('Counter unavailable');
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.api = originalApi;
        store.dispatch(api.util.resetApiState());
    });

    test.each([
        [{}, {data: {}}],
        [
            {error: {message: 'Topic already exists'}, issues: []},
            {error: {error: {message: 'Topic already exists'}, issues: []}},
        ],
    ])('preserves the creation result for response %j', async (response, expected) => {
        window.api = {
            viewer: {sendQuery: async () => response},
        } as unknown as YdbEmbeddedAPI;

        const result = await store.dispatch(
            topicApi.endpoints.createTopic.initiate({
                database: '/Root',
                formData: {
                    name: 'topic',
                    shards: 1,
                    writeQuotaBytes: 1024,
                    autoPartitioning: {enabled: false, mode: AutoPartitioningStrategy.Disabled},
                },
            }),
        );

        expect(result).toEqual(expected);
    });
});
