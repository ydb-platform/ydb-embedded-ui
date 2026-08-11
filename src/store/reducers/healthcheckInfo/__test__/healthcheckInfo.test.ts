import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import {api} from '../../api';
import {healthcheckApi} from '../healthcheckInfo';

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

describe('healthcheckInfoApi', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('forwards the selected database cluster to ViewerAPI', async () => {
        const getHealthcheckInfo = jest.fn().mockResolvedValue({});
        window.api = {viewer: {getHealthcheckInfo}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        await store.dispatch(
            healthcheckApi.endpoints.getHealthcheckInfo.initiate(
                {
                    database: '/Root/database',
                    clusterName: 'selected-cluster',
                },
                {subscribe: false},
            ),
        );

        expect(getHealthcheckInfo).toHaveBeenCalledWith(
            {
                database: '/Root/database',
                maxLevel: undefined,
                clusterName: 'selected-cluster',
            },
            {signal: expect.any(AbortSignal)},
        );
    });
});
