import {createSelector, createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {TracingLevelNumber} from '../../../types/api/query';
import type {QueryAction, QueryRequestParams, QuerySettings} from '../../../types/store/query';
import type {StreamDataChunk} from '../../../types/store/streaming';
import {loadFromSessionStorage, saveToSessionStorage} from '../../../utils';
import {
    QUERY_EDITOR_CURRENT_QUERY_KEY,
    QUERY_EDITOR_DIRTY_KEY,
    QUERY_TECHNICAL_MARK,
} from '../../../utils/constants';
import {
    RESOURCE_POOL_NO_OVERRIDE_VALUE,
    isQueryErrorResponse,
    parseQueryAPIResponse,
} from '../../../utils/query';
import {isNumeric} from '../../../utils/utils';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import {prepareQueryData} from './prepareQueryData';
import {
    addStreamingChunks as addStreamingChunksReducer,
    setStreamQueryResponse as setStreamQueryResponseReducer,
    setStreamSession as setStreamSessionReducer,
} from './streamingReducers';
import type {QueryResult, QueryState, QueryStats} from './types';
import {getActionAndSyntaxFromQueryMode, prepareQueryWithPragmas} from './utils';

const rawQuery = loadFromSessionStorage(QUERY_EDITOR_CURRENT_QUERY_KEY);
const input = typeof rawQuery === 'string' ? rawQuery : '';

const isDirty = Boolean(loadFromSessionStorage(QUERY_EDITOR_DIRTY_KEY));

const initialState: QueryState = {
    input,
    isDirty,

    historyFilter: '',
    historyCurrentQueryId: undefined,
};

const slice = createSlice({
    name: 'query',
    initialState,
    reducers: {
        changeUserInput: (state, action: PayloadAction<{input: string}>) => {
            state.input = action.payload.input;
            saveToSessionStorage(QUERY_EDITOR_CURRENT_QUERY_KEY, action.payload.input);
        },
        setIsDirty: (state, action: PayloadAction<boolean>) => {
            state.isDirty = action.payload;
            saveToSessionStorage(QUERY_EDITOR_DIRTY_KEY, action.payload);
        },
        setQueryResult: (state, action: PayloadAction<QueryResult | undefined>) => {
            state.result = action.payload;
        },
        setTenantPath: (state, action: PayloadAction<string>) => {
            state.tenantPath = action.payload;
        },
        setQueryHistoryFilter: (state, action: PayloadAction<string>) => {
            state.historyFilter = action.payload;
        },
        setHistoryCurrentQueryId: (state, action: PayloadAction<string | undefined>) => {
            state.historyCurrentQueryId = action.payload;
        },
        setResultTab: (
            state,
            action: PayloadAction<{queryType: 'execute' | 'explain'; tabId: string}>,
        ) => {
            const {queryType, tabId} = action.payload;
            if (!state.selectedResultTab) {
                state.selectedResultTab = {};
            }
            state.selectedResultTab[queryType] = tabId;
        },
        setStreamSession: setStreamSessionReducer,
        addStreamingChunks: addStreamingChunksReducer,
        setStreamQueryResponse: setStreamQueryResponseReducer,
    },
    selectors: {
        selectQueriesHistoryFilter: (state) => state.historyFilter || '',
        selectHistoryCurrentQueryId: (state) => state.historyCurrentQueryId,
        selectTenantPath: (state) => state.tenantPath,
        selectResult: (state) => state.result,
        selectStartTime: (state) => state.result?.startTime,
        selectEndTime: (state) => state.result?.endTime,
        selectUserInput: (state) => state.input,
        selectIsDirty: (state) => state.isDirty,
        selectResultTab: (state) => state.selectedResultTab,
    },
});

export const selectQueryDuration = createSelector(
    slice.selectors.selectStartTime,
    slice.selectors.selectEndTime,
    (startTime, endTime) => {
        return {
            startTime,
            endTime,
        };
    },
);

export default slice.reducer;
export const {
    changeUserInput,
    setQueryResult,
    setTenantPath,
    setQueryHistoryFilter,
    setHistoryCurrentQueryId,
    addStreamingChunks,
    setStreamQueryResponse,
    setStreamSession,
    setIsDirty,
    setResultTab,
} = slice.actions;

export const {
    selectQueriesHistoryFilter,
    selectHistoryCurrentQueryId,
    selectTenantPath,
    selectResult,
    selectUserInput,
    selectIsDirty,
    selectResultTab,
} = slice.selectors;

const getResourcePoolsQueryText = () => {
    return `${QUERY_TECHNICAL_MARK}
SELECT
    Name
FROM \`.sys/resource_pools\`
ORDER BY Name
`;
};

interface SendQueryParams extends QueryRequestParams {
    actionType?: QueryAction;
    queryId: string;
    querySettings?: Partial<QuerySettings>;
    // flag whether to send new tracing header or not
    // default: not send
    enableTracingLevel?: boolean;
    base64?: boolean;
}

// Stream query receives queryId from session chunk.
type StreamQueryParams = Omit<SendQueryParams, 'queryId'>;

const DEFAULT_CONCURRENT_RESULTS = false;

export const queryApi = api.injectEndpoints({
    endpoints: (build) => ({
        useStreamQuery: build.mutation<null, StreamQueryParams>({
            queryFn: async (
                {query, database, querySettings = {}, enableTracingLevel, base64},
                {signal, dispatch, getState},
            ) => {
                const startTime = Date.now();
                dispatch(
                    setQueryResult({
                        type: 'execute',
                        queryId: '',
                        isLoading: true,
                        startTime,
                    }),
                );

                const {action, syntax} = getActionAndSyntaxFromQueryMode(
                    'execute',
                    querySettings?.queryMode,
                );

                const finalQuery = prepareQueryWithPragmas(query, querySettings.pragmas);

                try {
                    let streamDataChunkBatch: StreamDataChunk[] = [];
                    let batchTimeout: number | null = null;

                    const flushBatch = () => {
                        if (streamDataChunkBatch.length > 0) {
                            dispatch(addStreamingChunks(streamDataChunkBatch));
                            streamDataChunkBatch = [];
                        }
                        batchTimeout = null;
                    };

                    await window.api.streaming.streamQuery(
                        {
                            query: finalQuery,
                            database,
                            action,
                            syntax,
                            stats: querySettings.statisticsMode,
                            tracingLevel:
                                querySettings.tracingLevel && enableTracingLevel
                                    ? TracingLevelNumber[querySettings.tracingLevel]
                                    : undefined,
                            limit_rows: isNumeric(querySettings.limitRows)
                                ? Number(querySettings.limitRows)
                                : undefined,
                            transaction_mode:
                                querySettings.transactionMode === 'implicit'
                                    ? undefined
                                    : querySettings.transactionMode,
                            timeout: isNumeric(querySettings.timeout)
                                ? Number(querySettings.timeout) * 1000
                                : undefined,
                            output_chunk_max_size: isNumeric(querySettings.outputChunkMaxSize)
                                ? Number(querySettings.outputChunkMaxSize)
                                : undefined,
                            concurrent_results: DEFAULT_CONCURRENT_RESULTS || undefined,
                            base64,
                            resource_pool:
                                querySettings.resourcePool === RESOURCE_POOL_NO_OVERRIDE_VALUE ||
                                !querySettings.resourcePool
                                    ? undefined
                                    : querySettings.resourcePool,
                        },
                        {
                            signal,
                            // First chunk is session chunk
                            onSessionChunk: (chunk) => {
                                dispatch(setStreamSession(chunk));
                            },
                            // Data chunks follow session chunk
                            onStreamDataChunk: (chunk) => {
                                streamDataChunkBatch.push(chunk);
                                if (!batchTimeout) {
                                    batchTimeout = window.requestAnimationFrame(flushBatch);
                                }
                            },
                            // Last chunk is query response chunk
                            onQueryResponseChunk: (chunk) => {
                                dispatch(setStreamQueryResponse(chunk));
                            },
                        },
                    );

                    // Flush any remaining chunks
                    if (batchTimeout) {
                        window.cancelAnimationFrame(batchTimeout);
                        flushBatch();
                    }

                    return {data: null};
                } catch (error) {
                    const state = getState() as RootState;
                    if (state.query.result?.startTime !== startTime) {
                        // This query is no longer current, don't update state
                        return {error};
                    }
                    dispatch(
                        setQueryResult({
                            ...state.query.result,
                            type: 'execute',
                            error,
                            isLoading: false,
                            startTime,
                            endTime: Date.now(),
                            queryId: state.query.result?.queryId || '',
                        }),
                    );
                    return {error};
                }
            },
        }),
        useSendQuery: build.mutation<{queryStats: QueryStats; queryId: string}, SendQueryParams>({
            queryFn: async (
                {
                    actionType = 'execute',
                    query,
                    database,
                    querySettings = {},
                    enableTracingLevel,
                    queryId,
                    base64,
                },
                {signal, dispatch, getState},
            ) => {
                const startTime = Date.now();
                dispatch(
                    setQueryResult({
                        type: actionType,
                        queryId,
                        isLoading: true,
                        startTime,
                    }),
                );

                const {action, syntax} = getActionAndSyntaxFromQueryMode(
                    actionType,
                    querySettings?.queryMode,
                );

                const finalQuery = prepareQueryWithPragmas(query, querySettings.pragmas);

                try {
                    const timeStart = Date.now();
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: finalQuery,
                            database,
                            action,
                            syntax,
                            stats: querySettings.statisticsMode,
                            tracingLevel:
                                querySettings.tracingLevel && enableTracingLevel
                                    ? TracingLevelNumber[querySettings.tracingLevel]
                                    : undefined,
                            limit_rows: isNumeric(querySettings.limitRows)
                                ? Number(querySettings.limitRows)
                                : undefined,
                            transaction_mode:
                                querySettings.transactionMode === 'implicit'
                                    ? undefined
                                    : querySettings.transactionMode,
                            timeout: isNumeric(querySettings.timeout)
                                ? Number(querySettings.timeout) * 1000
                                : undefined,
                            query_id: queryId,
                            base64,
                            resource_pool:
                                querySettings.resourcePool === RESOURCE_POOL_NO_OVERRIDE_VALUE ||
                                !querySettings.resourcePool
                                    ? undefined
                                    : querySettings.resourcePool,
                        },
                        {signal},
                    );

                    if (isQueryErrorResponse(response)) {
                        dispatch(
                            setQueryResult({
                                type: actionType,
                                error: response,
                                isLoading: false,
                                queryId,
                                startTime,
                                endTime: Date.now(),
                            }),
                        );
                        return {error: response};
                    }

                    const data = prepareQueryData(response);
                    data.traceId = response?._meta?.traceId;

                    const queryStats: QueryStats = {};

                    if (actionType === 'execute') {
                        if (data.stats) {
                            const {DurationUs, Executions: [{FinishTimeMs}] = [{}]} = data.stats;
                            queryStats.durationUs = DurationUs;
                            queryStats.endTime = FinishTimeMs;
                        } else {
                            const now = Date.now();
                            queryStats.durationUs = (now - timeStart) * 1000;
                            queryStats.endTime = now;
                        }
                    }

                    dispatch(
                        setQueryResult({
                            type: actionType,
                            data,
                            isLoading: false,
                            queryId,
                            startTime,
                            endTime: Date.now(),
                        }),
                    );
                    return {data: {queryStats, queryId}};
                } catch (error) {
                    const state = getState() as RootState;
                    if (state.query.result?.startTime !== startTime) {
                        // This query is no longer current, don't update state
                        return {error};
                    }
                    dispatch(
                        setQueryResult({
                            type: actionType,
                            error,
                            isLoading: false,
                            queryId,
                            startTime,
                            endTime: Date.now(),
                        }),
                    );
                    return {error};
                }
            },
        }),
        getResourcePools: build.query<string[], {database: string}>({
            queryFn: async ({database}, {signal}) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: getResourcePoolsQueryText(),
                            database,
                            action: 'execute-query',
                            internal_call: true,
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIResponse(response);
                    const rows = data.resultSets?.[0]?.result || [];
                    const pools = rows
                        .map((row) => row && row.Name)
                        .filter((name): name is string => Boolean(name));

                    return {data: pools};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
