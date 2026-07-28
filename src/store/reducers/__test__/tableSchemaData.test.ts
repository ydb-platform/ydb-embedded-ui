import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {EPathType} from '../../../types/api/schema';
import {api} from '../api';
import {tableSchemaDataApi} from '../tableSchemaData';

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

function getRetainedSubscriptions(store: ReturnType<typeof createTestStore>) {
    const selectors = store.dispatch(
        api.internalActions.internal_getRTKQSubscriptions(),
    ) as unknown as {
        getSubscriptions: () => Record<string, Record<string, unknown>>;
    };

    return Object.fromEntries(
        Object.entries(selectors.getSubscriptions()).filter(
            ([, subscriptions]) => Object.keys(subscriptions).length > 0,
        ),
    );
}

describe('tableSchemaDataApi', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('does not retain an overview subscription after loading table schema', async () => {
        const getDescribe = jest.fn().mockResolvedValue({
            PathDescription: {
                Table: {
                    Columns: [{Name: 'system_column'}],
                },
            },
        });
        window.api = {viewer: {getDescribe}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        await store.dispatch(
            tableSchemaDataApi.endpoints.getTableSchemaData.initiate(
                {
                    path: '/local/.sys/view',
                    database: '/local',
                    databaseFullPath: '/local',
                    type: EPathType.EPathTypeSysView,
                },
                {subscribe: false},
            ),
        );

        expect(getDescribe).toHaveBeenCalledTimes(1);
        expect(getRetainedSubscriptions(store)).toEqual({});
    });

    test('does not retain a view-schema subscription after loading view schema', async () => {
        const sendQuery = jest.fn().mockResolvedValue({
            result: [{columns: [{name: 'view_column', type: 'Utf8'}]}],
        });
        window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        await store.dispatch(
            tableSchemaDataApi.endpoints.getTableSchemaData.initiate(
                {
                    path: '/local/view',
                    database: '/local',
                    databaseFullPath: '/local',
                    type: EPathType.EPathTypeView,
                },
                {subscribe: false},
            ),
        );

        expect(sendQuery).toHaveBeenCalledTimes(1);
        expect(getRetainedSubscriptions(store)).toEqual({});
    });
});
