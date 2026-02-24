import type {
    QueryResponseChunk,
    SessionChunk,
    StreamDataChunk,
} from '../../../../types/store/streaming';
import queryReducer, {
    addStreamingChunks,
    setQueryResult,
    setStreamQueryResponse,
    setStreamSession,
} from '../query';
import type {QueryState} from '../types';

function createStateWithStreamingResult(): QueryState {
    return {
        activeTabId: 'tab-1',
        tabsOrder: ['tab-1'],
        tabsById: {
            'tab-1': {
                id: 'tab-1',
                title: '',
                input: '',
                isDirty: false,
                createdAt: 0,
                updatedAt: 0,
                result: {
                    type: 'execute',
                    queryId: '',
                    isLoading: true,
                    startTime: Date.now(),
                    streamingStatus: 'preparing',
                },
            },
        },
    };
}

describe.only('Streaming query status transitions', () => {
    test('initial streaming query should have status "preparing"', () => {
        const initialState: QueryState = {
            activeTabId: 'tab-1',
            tabsOrder: ['tab-1'],
            tabsById: {
                'tab-1': {
                    id: 'tab-1',
                    title: '',
                    input: '',
                    isDirty: false,
                    createdAt: 0,
                    updatedAt: 0,
                },
            },
        };

        const state = queryReducer(
            initialState,
            setQueryResult({
                tabId: 'tab-1',
                result: {
                    type: 'execute',
                    queryId: '',
                    isLoading: true,
                    startTime: Date.now(),
                    streamingStatus: 'preparing',
                },
            }),
        );

        expect(state.tabsById['tab-1'].result?.streamingStatus).toBe('preparing');
        expect(state.tabsById['tab-1'].result?.isLoading).toBe(true);
    });

    test('setStreamSession should transition status to "running"', () => {
        const initialState = createStateWithStreamingResult();

        const sessionChunk: SessionChunk = {
            meta: {
                event: 'SessionCreated',
                node_id: 1,
                query_id: 'test-query-id',
                session_id: 'test-session-id',
            },
        };

        const state = queryReducer(
            initialState,
            setStreamSession({tabId: 'tab-1', chunk: sessionChunk}),
        );

        expect(state.tabsById['tab-1'].result?.streamingStatus).toBe('running');
        expect(state.tabsById['tab-1'].result?.isLoading).toBe(true);
        expect(state.tabsById['tab-1'].result?.queryId).toBe('test-query-id');
    });

    test('addStreamingChunks should transition status to "fetching"', () => {
        const initialState = createStateWithStreamingResult();
        // Simulate session already received
        initialState.tabsById['tab-1'].result!.streamingStatus = 'running';
        initialState.tabsById['tab-1'].result!.queryId = 'test-query-id';

        const chunks: StreamDataChunk[] = [
            {
                meta: {event: 'StreamData', seq_no: 0, result_index: 0},
                result: {
                    columns: [{name: 'id', type: 'Uint64'}],
                    rows: [['1']],
                },
            },
        ];

        const state = queryReducer(initialState, addStreamingChunks({tabId: 'tab-1', chunks}));

        expect(state.tabsById['tab-1'].result?.streamingStatus).toBe('fetching');
        expect(state.tabsById['tab-1'].result?.isLoading).toBe(true);
    });

    test('setStreamQueryResponse should clear streaming status', () => {
        const initialState = createStateWithStreamingResult();
        initialState.tabsById['tab-1'].result!.streamingStatus = 'fetching';

        const responseChunk: QueryResponseChunk = {
            meta: {event: 'QueryResponse', version: '1', type: 'query'},
        };

        const state = queryReducer(
            initialState,
            setStreamQueryResponse({tabId: 'tab-1', chunk: responseChunk}),
        );

        expect(state.tabsById['tab-1'].result?.streamingStatus).toBeUndefined();
        expect(state.tabsById['tab-1'].result?.isLoading).toBe(false);
    });

    test('full streaming lifecycle: preparing → running → fetching → done', () => {
        const initialState: QueryState = {
            activeTabId: 'tab-1',
            tabsOrder: ['tab-1'],
            tabsById: {
                'tab-1': {
                    id: 'tab-1',
                    title: '',
                    input: '',
                    isDirty: false,
                    createdAt: 0,
                    updatedAt: 0,
                },
            },
        };

        // Step 1: Query starts → preparing
        let state = queryReducer(
            initialState,
            setQueryResult({
                tabId: 'tab-1',
                result: {
                    type: 'execute',
                    queryId: '',
                    isLoading: true,
                    startTime: Date.now(),
                    streamingStatus: 'preparing',
                },
            }),
        );
        expect(state.tabsById['tab-1'].result?.streamingStatus).toBe('preparing');

        // Step 2: Session created → running
        state = queryReducer(
            state,
            setStreamSession({
                tabId: 'tab-1',
                chunk: {
                    meta: {
                        event: 'SessionCreated',
                        node_id: 1,
                        query_id: 'q-1',
                        session_id: 's-1',
                    },
                },
            }),
        );
        expect(state.tabsById['tab-1'].result?.streamingStatus).toBe('running');

        // Step 3: First data chunk → fetching
        state = queryReducer(
            state,
            addStreamingChunks({
                tabId: 'tab-1',
                chunks: [
                    {
                        meta: {event: 'StreamData', seq_no: 0, result_index: 0},
                        result: {
                            columns: [{name: 'col1', type: 'Utf8'}],
                            rows: [['value1']],
                        },
                    },
                ],
            }),
        );
        expect(state.tabsById['tab-1'].result?.streamingStatus).toBe('fetching');

        // Step 4: Query response → done
        state = queryReducer(
            state,
            setStreamQueryResponse({
                tabId: 'tab-1',
                chunk: {
                    meta: {event: 'QueryResponse', version: '1', type: 'query'},
                },
            }),
        );
        expect(state.tabsById['tab-1'].result?.streamingStatus).toBeUndefined();
        expect(state.tabsById['tab-1'].result?.isLoading).toBe(false);
    });

    test('non-streaming query result should not have streamingStatus', () => {
        const initialState: QueryState = {
            activeTabId: 'tab-1',
            tabsOrder: ['tab-1'],
            tabsById: {
                'tab-1': {
                    id: 'tab-1',
                    title: '',
                    input: '',
                    isDirty: false,
                    createdAt: 0,
                    updatedAt: 0,
                },
            },
        };

        const state = queryReducer(
            initialState,
            setQueryResult({
                tabId: 'tab-1',
                result: {
                    type: 'execute',
                    queryId: 'regular-query',
                    isLoading: true,
                    startTime: Date.now(),
                },
            }),
        );

        expect(state.tabsById['tab-1'].result?.streamingStatus).toBeUndefined();
    });

    test('late batch flush after response should not revert streamingStatus', () => {
        const initialState = createStateWithStreamingResult();
        initialState.tabsById['tab-1'].result!.streamingStatus = 'fetching';
        initialState.tabsById['tab-1'].result!.queryId = 'test-query-id';

        // Response arrives first
        const responseChunk: QueryResponseChunk = {
            meta: {event: 'QueryResponse', version: '1', type: 'query'},
        };
        let state = queryReducer(
            initialState,
            setStreamQueryResponse({tabId: 'tab-1', chunk: responseChunk}),
        );
        expect(state.tabsById['tab-1'].result?.streamingStatus).toBeUndefined();
        expect(state.tabsById['tab-1'].result?.isLoading).toBe(false);

        // Late batch flush arrives after response
        const chunks: StreamDataChunk[] = [
            {
                meta: {event: 'StreamData', seq_no: 99, result_index: 0},
                result: {rows: [['late-value']]},
            },
        ];
        state = queryReducer(state, addStreamingChunks({tabId: 'tab-1', chunks}));

        expect(state.tabsById['tab-1'].result?.streamingStatus).toBeUndefined();
        expect(state.tabsById['tab-1'].result?.isLoading).toBe(false);
    });

    test('setStreamSession on tab without result should be a no-op', () => {
        const initialState: QueryState = {
            activeTabId: 'tab-1',
            tabsOrder: ['tab-1'],
            tabsById: {
                'tab-1': {
                    id: 'tab-1',
                    title: '',
                    input: '',
                    isDirty: false,
                    createdAt: 0,
                    updatedAt: 0,
                },
            },
        };

        const sessionChunk: SessionChunk = {
            meta: {
                event: 'SessionCreated',
                node_id: 1,
                query_id: 'test-query-id',
                session_id: 'test-session-id',
            },
        };

        const state = queryReducer(
            initialState,
            setStreamSession({tabId: 'tab-1', chunk: sessionChunk}),
        );

        expect(state.tabsById['tab-1'].result).toBeUndefined();
    });
});
