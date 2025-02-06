/* eslint-disable complexity */
/* eslint-disable no-param-reassign */
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {settingsManager} from '../../../services/settings';
import type {ColumnType} from '../../../types/api/query';
import {TracingLevelNumber} from '../../../types/api/query';
import type {QueryAction, QueryRequestParams, QuerySettings} from '../../../types/store/query';
import type {
    QueryResponseChunk,
    SessionChunk,
    StreamDataChunk,
} from '../../../types/store/streaming';
import {QUERIES_HISTORY_KEY} from '../../../utils/constants';
import {isQueryErrorResponse, parseResult} from '../../../utils/query';
import {isNumeric} from '../../../utils/utils';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import {preparePlanData} from './preparePlanData';
import {prepareQueryData} from './prepareQueryData';
import type {QueryResult, QueryState} from './types';
import {getActionAndSyntaxFromQueryMode, getQueryInHistory} from './utils';

const MAXIMUM_QUERIES_IN_HISTORY = 20;
export const INDEX_COLUMN: ColumnType = {name: '#', type: 'Uint64'};

const queriesHistoryInitial = settingsManager.readUserSettingsValue(
    QUERIES_HISTORY_KEY,
    [],
) as string[];

const sliceLimit = queriesHistoryInitial.length - MAXIMUM_QUERIES_IN_HISTORY;

const initialState: QueryState = {
    input: '',
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
        setStreamSession: (state, action: PayloadAction<SessionChunk>) => {
            if (!state.result) {
                return;
            }

            if (!state.result.data) {
                state.result.data = prepareQueryData(null);
            }

            const chunk = action.payload;
            state.result.isLoading = true;
            state.result.queryId = chunk.meta.query_id;
            state.result.data.traceId = chunk.meta.trace_id;
        },
        addStreamingChunks: (state, action: PayloadAction<StreamDataChunk[]>) => {
            if (!state.result) {
                return;
            }

            if (!state.result.data) {
                state.result.data = prepareQueryData(null);
            }

            // Initialize speed metrics if not present
            if (!state.result.speedMetrics) {
                state.result.speedMetrics = {
                    rowsPerSecond: 0,
                    lastUpdateTime: Date.now(),
                    recentChunks: [],
                };
            }

            const currentTime = Date.now();
            let totalNewRows = 0;

            const mergedStreamDataChunks = new Map<number, StreamDataChunk>();
            for (const chunk of action.payload) {
                const currentMergedChunk = mergedStreamDataChunks.get(chunk.meta.result_index);
                const chunkRowCount = (chunk.result.rows || []).length;
                totalNewRows += chunkRowCount;

                if (currentMergedChunk) {
                    if (!currentMergedChunk.result.rows) {
                        currentMergedChunk.result.rows = [];
                    }
                    for (const row of chunk.result.rows || []) {
                        currentMergedChunk.result.rows.push(row);
                    }
                } else {
                    mergedStreamDataChunks.set(chunk.meta.result_index, chunk);
                }
            }

            // Update speed metrics
            const metrics = state.result.speedMetrics;
            metrics.recentChunks.push({
                timestamp: currentTime,
                rowCount: totalNewRows,
            });

            // Keep only chunks from the last 5 seconds
            const WINDOW_SIZE = 5000; // 5 seconds in milliseconds
            metrics.recentChunks = metrics.recentChunks.filter(
                (chunk) => currentTime - chunk.timestamp <= WINDOW_SIZE,
            );

            // Calculate moving average
            if (metrics.recentChunks.length > 0) {
                const oldestChunkTime = metrics.recentChunks[0].timestamp;
                const timeWindow = (currentTime - oldestChunkTime) / 1000; // Convert to seconds
                const totalRows = metrics.recentChunks.reduce(
                    (sum, chunk) => sum + chunk.rowCount,
                    0,
                );
                metrics.rowsPerSecond = timeWindow > 0 ? totalRows / timeWindow : 0;
            }

            metrics.lastUpdateTime = currentTime;

            if (!state.result.data.resultSets) {
                state.result.data.resultSets = [];
            }

            for (const [resultIndex, chunk] of mergedStreamDataChunks.entries()) {
                const {columns, rows} = chunk.result;

                if (!state.result.data.resultSets[resultIndex]) {
                    state.result.data.resultSets[resultIndex] = {};
                }

                if (columns && !state.result.data.resultSets[resultIndex].columns?.length) {
                    const columnsWithIndex = [INDEX_COLUMN, ...columns];
                    if (!state.result.data.resultSets) {
                        state.result.data.resultSets = [];
                    }

                    if (state.result.data.resultSets[resultIndex]) {
                        state.result.data.resultSets[resultIndex].columns = columnsWithIndex;
                    } else {
                        state.result.data.resultSets[resultIndex] = {
                            columns: columnsWithIndex,
                            result: [],
                        };
                    }
                }

                const indexedRows = (rows || []).map((row, index) => [
                    (state.result?.data?.resultSets?.[resultIndex].totalCount || 1) + index,
                    ...row,
                ]);

                const formattedRows = parseResult(
                    indexedRows,
                    state.result.data.resultSets[resultIndex].columns || [],
                );

                // Update result set by pushing formatted rows directly
                if (!state.result.data.resultSets?.[resultIndex].resultChunks) {
                    // eslint-disable-next-line new-cap
                    state.result.data.resultSets[resultIndex].resultChunks = [];
                }

                state.result.data.resultSets[resultIndex].resultChunks.push(formattedRows);
                state.result.data.resultSets[resultIndex].totalCount = state.result.data.resultSets[
                    resultIndex
                ].totalCount
                    ? formattedRows.length + state.result.data.resultSets[resultIndex].totalCount
                    : formattedRows.length;
            }
        },
        setStreamQueryResponse: (state, action: PayloadAction<QueryResponseChunk>) => {
            if (!state.result) {
                return;
            }

            if (!state.result.data) {
                state.result.data = prepareQueryData(null);
            }

            state.result.isLoading = false;

            const chunk = action.payload;
            if ('error' in chunk) {
                state.result.error = chunk;
            } else if ('plan' in chunk) {
                if (!state.result.data) {
                    state.result.data = prepareQueryData(null);
                }

                const {plan: rawPlan, stats} = chunk;
                const {simplifiedPlan, ...planData} = preparePlanData(rawPlan, stats);
                state.result.data.preparedPlan =
                    Object.keys(planData).length > 0 ? planData : undefined;
                state.result.data.simplifiedPlan = simplifiedPlan;
                state.result.data.plan = chunk.plan;
                state.result.data.stats = chunk.stats;
            }
        },
    },
    selectors: {
        selectQueriesHistoryFilter: (state) => state.history.filter || '',
        selectTenantPath: (state) => state.tenantPath,
        selectResult: (state) => state.result,
        selectQueriesHistory: (state) => {
            const items = state.history.queries;
            const filter = state.history.filter?.toLowerCase();

            return filter
                ? items.filter((item) => item.queryText.toLowerCase().includes(filter))
                : items;
        },
        selectUserInput: (state) => state.input,
        selectQueriesHistoryCurrentIndex: (state) => state.history?.currentIndex,
    },
});

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
} = slice.actions;

export const {
    selectQueriesHistoryFilter,
    selectQueriesHistoryCurrentIndex,
    selectQueriesHistory,
    selectTenantPath,
    selectResult,
    selectUserInput,
} = slice.selectors;

interface SendQueryParams extends QueryRequestParams {
    actionType?: QueryAction;
    queryId: string;
    querySettings?: Partial<QuerySettings>;
    // flag whether to send new tracing header or not
    // default: not send
    enableTracingLevel?: boolean;
}

interface QueryStats {
    durationUs?: string | number;
    endTime?: string | number;
}

const DEFAULT_STREAM_CHUNK_SIZE = 1000;
const DEFAULT_CONCURRENT_RESULTS = false;

export const queryApi = api.injectEndpoints({
    endpoints: (build) => ({
        useStreamQuery: build.mutation<null, SendQueryParams>({
            queryFn: async (
                {query, database, querySettings = {}, enableTracingLevel, queryId},
                {signal, dispatch, getState},
            ) => {
                dispatch(setQueryResult({type: 'execute', queryId, isLoading: true}));

                const {action, syntax} = getActionAndSyntaxFromQueryMode(
                    'execute',
                    querySettings?.queryMode,
                );

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
                            query,
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
                            onQueryResponseChunk: (chunk) => {
                                dispatch(setStreamQueryResponse(chunk));
                            },
                            onSessionChunk: (chunk) => {
                                dispatch(setStreamSession(chunk));
                            },
                            onStreamDataChunk: (chunk) => {
                                streamDataChunkBatch.push(chunk);
                                if (!batchTimeout) {
                                    batchTimeout = window.requestAnimationFrame(flushBatch);
                                }
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
                    dispatch(
                        setQueryResult({
                            ...state.query.result,
                            type: 'execute',
                            error,
                            isLoading: false,
                            queryId,
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
                {signal, dispatch},
            ) => {
                const timeStart = Date.now();
                dispatch(setQueryResult({type: actionType, queryId, isLoading: true}));

                const {action, syntax} = getActionAndSyntaxFromQueryMode(
                    actionType,
                    querySettings?.queryMode,
                );

                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query,
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
                        }),
                    );
                    return {data: null};
                } catch (error) {
                    dispatch(
                        setQueryResult({
                            type: actionType,
                            error,
                            isLoading: false,
                            queryId,
                        }),
                    );
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
