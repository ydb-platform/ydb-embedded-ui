import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import type {ExecuteResponse} from '../../../../types/api/query';
import {api} from '../../api';
import {queryApi} from '../api';
import queryReducer from '../query';

describe('query result data', () => {
    const originalApi = window.api;
    afterEach(() => {
        window.api = originalApi;
    });

    test.each(['execute', 'explain-analyze'] as const)(
        'preserves result sets through the %s endpoint and reducer',
        async (actionType) => {
            const response = {
                result: [
                    {columns: [{name: 'value', type: 'Int32'}], rows: [[1]], truncated: false},
                ],
            } satisfies ExecuteResponse;
            const sendQuery = jest.fn().mockResolvedValue(response);
            window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
            const store = configureStore({
                reducer: {query: queryReducer, [api.reducerPath]: api.reducer},
                middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
            });
            const tabId = store.getState().query.tabsOrder[0];
            await store
                .dispatch(
                    queryApi.endpoints.useSendQuery.initiate({
                        tabId,
                        actionType,
                        startTime: 1,
                        query: 'SELECT 1;',
                        queryId: 'query',
                        database: '/local',
                        querySettings: {queryMode: 'query', statisticsMode: 'none'},
                    }),
                )
                .unwrap();
            expect(store.getState().query.tabsById[tabId].result?.data?.resultSets).toEqual([
                {columns: [{name: 'value', type: 'Int32'}], result: [{value: 1}], truncated: false},
            ]);
            expect(sendQuery).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'execute-query',
                    stats: actionType === 'explain-analyze' ? 'full' : 'none',
                }),
                expect.anything(),
            );
            store.dispatch(api.util.resetApiState());
        },
    );
});
