import {createSelector, createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {settingsManager} from '../../../services/settings';
import {TracingLevelNumber} from '../../../types/api/query';
import type {QueryAction, QueryRequestParams, QuerySettings} from '../../../types/store/query';
import type {StreamDataChunk} from '../../../types/store/streaming';
import {loadFromSessionStorage, saveToSessionStorage} from '../../../utils';
import {
    QUERIES_HISTORY_KEY,
    QUERY_EDITOR_CURRENT_QUERY_KEY,
    QUERY_EDITOR_DIRTY_KEY,
} from '../../../utils/constants';
import {isQueryErrorResponse} from '../../../utils/query';
import {isNumeric} from '../../../utils/utils';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import {prepareQueryData} from './prepareQueryData';
import {
    addStreamingChunks as addStreamingChunksReducer,
    setStreamQueryResponse as setStreamQueryResponseReducer,
    setStreamSession as setStreamSessionReducer,
} from './streamingReducers';
import type {QueryResult, QueryState} from './types';
import {getActionAndSyntaxFromQueryMode, getQueryInHistory, prepareQueryWithPragmas} from './utils';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

const queriesHistoryInitial = settingsManager.readUserSettingsValue(
    QUERIES_HISTORY_KEY,
    [],
) as string[];

const sliceLimit = queriesHistoryInitial.length - MAXIMUM_QUERIES_IN_HISTORY;

const rawQuery = loadFromSessionStorage(QUERY_EDITOR_CURRENT_QUERY_KEY);
const input = typeof rawQuery === 'string' ? rawQuery : '';

const isDirty = Boolean(loadFromSessionStorage(QUERY_EDITOR_DIRTY_KEY));

const initialState: QueryState = {
    input,
    isDirty,
    history: {
        queries: queriesHistoryInitial
            .slice(sliceLimit < 0 ? 0 : sliceLimit)
            .map(getQueryInHistory),
        currentIndex:
            queriesHistoryInitial.length > MAXIMUM_QUERIES_IN_HISTORY
                ? MAXIMUM_QUERIES_IN_HISTORY - 1
                : queriesHistoryInitial.length - 1,
        filter: '',
    },
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
        saveQueryToHistory: (
            state,
            action: PayloadAction<{queryText: string; queryId: string}>,
        ) => {
            const {queryText, queryId} = action.payload;

            const newQueries = [...state.history.queries, {queryText, queryId}].slice(
                state.history.queries.length >= MAXIMUM_QUERIES_IN_HISTORY ? 1 : 0,
            );
            settingsManager.setUserSettingsValue(QUERIES_HISTORY_KEY, newQueries);
            const currentIndex = newQueries.length - 1;

            state.history = {
                queries: newQueries,
                currentIndex,
            };
        },
        updateQueryInHistory: (
            state,
            action: PayloadAction<{queryId: string; stats: QueryStats}>,
        ) => {
            const {queryId, stats} = action.payload;

            if (!stats) {
                return;
            }

            const index = state.history.queries.findIndex((item) => item.queryId === queryId);

            if (index === -1) {
                return;
            }

            const newQueries = [...state.history.queries];
            const {durationUs, endTime} = stats;
            newQueries.splice(index, 1, {
                ...state.history.queries[index],
                durationUs,
                endTime,
            });

            settingsManager.setUserSettingsValue(QUERIES_HISTORY_KEY, newQueries);

            state.history.queries = newQueries;
        },
        goToPreviousQuery: (state) => {
            const currentIndex = state.history.currentIndex;
            if (currentIndex <= 0) {
                return;
            }
            const newCurrentIndex = currentIndex - 1;
            const query = state.history.queries[newCurrentIndex];
            state.input = query.queryText;
            state.history.currentIndex = newCurrentIndex;
        },
        goToNextQuery: (state) => {
            const currentIndex = state.history.currentIndex;
            if (currentIndex >= state.history.queries.length - 1) {
                return;
            }
            const newCurrentIndex = currentIndex + 1;
            const query = state.history.queries[newCurrentIndex];
            state.input = query.queryText;
            state.history.currentIndex = newCurrentIndex;
        },
        setTenantPath: (state, action: PayloadAction<string>) => {
            state.tenantPath = action.payload;
        },
        setQueryHistoryFilter: (state, action: PayloadAction<string>) => {
            state.history.filter = action.payload;
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
        selectQueriesHistoryFilter: (state) => state.history.filter || '',
        selectTenantPath: (state) => state.tenantPath,
        selectResult: (state) => state.result,
        selectStartTime: (state) => state.result?.startTime,
        selectEndTime: (state) => state.result?.endTime,
        selectUserInput: (state) => state.input,
        selectIsDirty: (state) => state.isDirty,
        selectQueriesHistoryCurrentIndex: (state) => state.history?.currentIndex,
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

export const selectQueriesHistory = createSelector(
    [
        (state: RootState) => state.query.history.queries,
        (state: RootState) => state.query.history.filter,
    ],
    (queries, filter) => {
        const normalizedFilter = filter?.toLowerCase();
        return normalizedFilter
            ? queries.filter((item) => item.queryText.toLowerCase().includes(normalizedFilter))
            : queries;
    },
);

export default slice.reducer;
export const {
    changeUserInput,
    setQueryResult,
    saveQueryToHistory,
    updateQueryInHistory,
    goToPreviousQuery,
    goToNextQuery,
    setTenantPath,
    setQueryHistoryFilter,
    addStreamingChunks,
    setStreamQueryResponse,
    setStreamSession,
    setIsDirty,
    setResultTab,
} = slice.actions;

export const {
    selectQueriesHistoryFilter,
    selectQueriesHistoryCurrentIndex,
    selectTenantPath,
    selectResult,
    selectUserInput,
    selectIsDirty,
    selectResultTab,
} = slice.selectors;

interface SendQueryParams extends QueryRequestParams {
    actionType?: QueryAction;
    queryId: string;
    querySettings?: Partial<QuerySettings>;
    // flag whether to send new tracing header or not
    // default: not send
    enableTracingLevel?: boolean;
}

// Stream query receives queryId from session chunk.
type StreamQueryParams = Omit<SendQueryParams, 'queryId'>;

interface QueryStats {
    durationUs?: string | number;
    endTime?: string | number;
}

const DEFAULT_STREAM_CHUNK_SIZE = 1000;
const DEFAULT_CONCURRENT_RESULTS = false;

export const queryApi = api.injectEndpoints({
    endpoints: (build) => ({
        useStreamQuery: build.mutation<null, StreamQueryParams>({
            queryFn: async (
                {query, database, querySettings = {}, enableTracingLevel},
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
                            output_chunk_max_size: DEFAULT_STREAM_CHUNK_SIZE,
                            concurrent_results: DEFAULT_CONCURRENT_RESULTS || undefined,
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
        useSendQuery: build.mutation<null, SendQueryParams>({
            queryFn: async (
                {
                    actionType = 'execute',
                    query,
                    database,
                    querySettings = {},
                    enableTracingLevel,
                    queryId,
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

                    if (actionType === 'execute') {
                        const queryStats: QueryStats = {};
                        if (data.stats) {
                            const {DurationUs, Executions: [{FinishTimeMs}] = [{}]} = data.stats;
                            queryStats.durationUs = DurationUs;
                            queryStats.endTime = FinishTimeMs;
                        } else {
                            const now = Date.now();
                            queryStats.durationUs = (now - timeStart) * 1000;
                            queryStats.endTime = now;
                        }

                        dispatch(updateQueryInHistory({stats: queryStats, queryId}));
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
                    return {data: null};
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
    }),
    overrideExisting: 'throw',
});
