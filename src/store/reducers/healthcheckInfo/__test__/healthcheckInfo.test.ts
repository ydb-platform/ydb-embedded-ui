import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import type {RootState} from '../../../defaultStore';
import {api} from '../../api';
import {healthcheckApi, selectLeavesIssues} from '../healthcheckInfo';

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

test('keeps pile issues isolated for clusters with the same root database', async () => {
    const originalApi = window.api;
    const store = createTestStore();
    const getHealthcheckInfo = jest.fn().mockImplementation(async ({clusterName}) => ({
        issue_log: [{id: clusterName, type: 'PILE_STATE_STORAGE', status: 'BLUE'}],
    }));
    window.api = {viewer: {getHealthcheckInfo}} as unknown as YdbEmbeddedAPI;
    try {
        for (const clusterName of ['cluster-a', 'cluster-b']) {
            await store.dispatch(
                healthcheckApi.endpoints.getHealthcheckInfo.initiate(
                    {database: '/Root', clusterName},
                    {subscribe: false},
                ),
            );
            expect(getHealthcheckInfo).toHaveBeenCalledWith(
                {database: '/Root', maxLevel: undefined, clusterName},
                {signal: expect.any(AbortSignal)},
            );
        }
        for (const clusterName of ['cluster-a', 'cluster-b']) {
            expect(
                selectLeavesIssues(store.getState() as RootState, '/Root', clusterName).map(
                    ({id}) => id,
                ),
            ).toEqual([clusterName]);
        }
    } finally {
        store.dispatch(api.util.resetApiState());
        window.api = originalApi;
    }
});
