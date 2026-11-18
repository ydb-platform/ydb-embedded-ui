import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import {api} from '../../api';
import {streamingQueriesApi} from '../streamingQuery';

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

describe('streaming query requests', () => {
    const originalApi = window.api;
    const text = String.raw`SELECT "a\\Qb\\Ec";`;
    const sendQuery = jest.fn();
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
        store = createTestStore();
        sendQuery.mockReset().mockResolvedValue({
            version: 12,
            result: [{columns: [{name: 'Text', type: 'Utf8?'}], rows: [[text]]}],
        });
        window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
    });

    afterEach(() => {
        store.dispatch(api.util.resetApiState());
        window.api = originalApi;
    });

    describe.each(['getStreamingQueryInfo', 'getStreamingQueryPlan'] as const)('%s', (endpoint) => {
        test.each([
            [String.raw`/local/q1\xtz`, String.raw`/local/q1\\xtz`],
            [String.raw`/local/q1\name`, String.raw`/local/q1\\name`],
            ["/local/q'1", String.raw`/local/q\'1`],
            [String.raw`/local/q\'1`, String.raw`/local/q\\\'1`],
        ])('escapes path %s as a YQL string literal', async (path, escapedPath) => {
            const result = await store.dispatch(
                streamingQueriesApi.endpoints[endpoint].initiate(
                    {database: '/local', path},
                    {subscribe: false},
                ),
            );

            expect(sendQuery).toHaveBeenCalledWith(
                {
                    database: '/local',
                    action: 'execute-query',
                    internal_call: true,
                    query: expect.stringContaining(`WHERE Path = '${escapedPath}'\nLIMIT 1`),
                },
                {signal: expect.any(AbortSignal), withRetries: true},
            );
            expect(result.data?.resultSets?.[0]?.result).toEqual([{Text: text}]);
        });
    });
});
