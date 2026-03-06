import {TracingLevelNumber} from '../../../types/api/query';
import type {QueryAction, QueryRequestParams, QuerySettings} from '../../../types/store/query';
import type {StreamDataChunk} from '../../../types/store/streaming';
import {valueIsDefined} from '../../../utils';
import {QUERY_TECHNICAL_MARK} from '../../../utils/constants';
import {
    MAX_QUERY_TIMEOUT_SECONDS,
    RESOURCE_POOL_NO_OVERRIDE_VALUE,
    isQueryErrorResponse,
    parseQueryAPIResponse,
} from '../../../utils/query';
import {isNumeric} from '../../../utils/utils';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import {prepareQueryData} from './parsers/prepareQueryData';
import {
    addStreamingChunks,
    setQueryResult,
    setStreamQueryResponse,
    setStreamSession,
} from './slice';
import type {QueryStats} from './types';
import {getActionAndSyntaxFromQueryMode, prepareQueryWithPragmas} from './utils';

function getTracingLevelParam(
    querySettings: Partial<QuerySettings>,
    enableTracingLevel: boolean | undefined,
): number | undefined {
    if (!enableTracingLevel) {
        return undefined;
    }

    const tracingLevel = querySettings.tracingLevel;
    return tracingLevel ? TracingLevelNumber[tracingLevel] : undefined;
}

function getLimitRowsParam(limitRows: unknown): number | undefined {
    return isNumeric(limitRows) ? Number(limitRows) : undefined;
}

function getTimeoutMsParam(timeoutSeconds: unknown): number | undefined {
    if (!isNumeric(timeoutSeconds)) {
        return undefined;
    }
    const seconds = Number(timeoutSeconds);
    if (seconds <= 0) {
        return undefined;
    }
    return Math.min(seconds, MAX_QUERY_TIMEOUT_SECONDS) * 1000;
}

function getTransactionModeParam(
    transactionMode: QuerySettings['transactionMode'] | undefined,
): QuerySettings['transactionMode'] | undefined {
    if (transactionMode === 'implicit') {
        return undefined;
    }
    return transactionMode;
}

function getResourcePoolParam(resourcePool: unknown): string | undefined {
    if (resourcePool === RESOURCE_POOL_NO_OVERRIDE_VALUE || !resourcePool) {
        return undefined;
    }
    return String(resourcePool);
}

function createExecuteQueryStats(
    data: ReturnType<typeof prepareQueryData>,
    timeStart: number,
    status?: QueryStats['status'],
): QueryStats {
    if (data.stats) {
        const {DurationUs, Executions: [{StartTimeMs}] = [{}]} = data.stats;
        return {
            startTime: valueIsDefined(StartTimeMs) ? Number(StartTimeMs) : timeStart,
            durationUs: DurationUs,
            status,
        };
    }

    const now = Date.now();
    return {startTime: timeStart, durationUs: (now - timeStart) * 1000, status};
}

const getResourcePoolsQueryText = () => {
    return `${QUERY_TECHNICAL_MARK}
SELECT
    Name
FROM \`.sys/resource_pools\`
ORDER BY Name
`;
};

interface SendQueryParams extends QueryRequestParams {
    tabId: string;
    actionType?: QueryAction;
    queryId: string;
    startTime: number;
    historyQueryId?: string;
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
        useStreamQuery: build.mutation<
            {
                queryStats: QueryStats;
                queryId: string | undefined;
                operationId: string | undefined;
                historyQueryId?: string;
            },
            StreamQueryParams
        >({
            // eslint-disable-next-line complexity
            queryFn: async (
                {
                    tabId,
                    startTime,
                    query,
                    database,
                    querySettings = {},
                    enableTracingLevel,
                    base64,
                    historyQueryId,
                },
                {signal, dispatch, getState},
            ) => {
                dispatch(
                    setQueryResult({
                        tabId,
                        result: {
                            type: 'execute',
                            queryId: '',
                            isLoading: true,
                            startTime,
                            streamingStatus: 'preparing',
                        },
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
                            dispatch(addStreamingChunks({tabId, chunks: streamDataChunkBatch}));
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
                            tracingLevel: getTracingLevelParam(querySettings, enableTracingLevel),
                            limit_rows: getLimitRowsParam(querySettings.limitRows),
                            transaction_mode: getTransactionModeParam(
                                querySettings.transactionMode,
                            ),
                            timeout: getTimeoutMsParam(querySettings.timeout),
                            output_chunk_max_size: isNumeric(querySettings.outputChunkMaxSize)
                                ? Number(querySettings.outputChunkMaxSize)
                                : undefined,
                            concurrent_results: DEFAULT_CONCURRENT_RESULTS || undefined,
                            base64,
                            resource_pool: getResourcePoolParam(querySettings.resourcePool),
                        },
                        {
                            signal,
                            // First chunk is session chunk
                            onSessionChunk: (chunk) => {
                                dispatch(setStreamSession({tabId, chunk}));
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
                                dispatch(setStreamQueryResponse({tabId, chunk}));
                            },
                        },
                    );

                    // Flush any remaining chunks
                    if (batchTimeout) {
                        window.cancelAnimationFrame(batchTimeout);
                        flushBatch();
                    }

                    const state = getState() as RootState;
                    const currentTabResult = state.query.tabsById[tabId]?.result;

                    const queryStats: QueryStats = createExecuteQueryStats(
                        currentTabResult?.data ?? {},
                        startTime,
                        'completed',
                    );

                    return {
                        data: {
                            queryStats,
                            queryId: currentTabResult?.queryId,
                            operationId: currentTabResult?.operationId,
                            historyQueryId,
                        },
                    };
                } catch (error) {
                    const state = getState() as RootState;
                    const currentTabResult = state.query.tabsById[tabId]?.result;

                    const queryStats: QueryStats = createExecuteQueryStats(
                        currentTabResult?.data ?? {},
                        startTime,
                        'failed',
                    );
                    const queryId = currentTabResult?.queryId || '';

                    const err = {
                        error,
                        extra: {
                            queryStats,
                            queryId,
                            operationId: currentTabResult?.operationId,
                            historyQueryId,
                        },
                    };

                    if (currentTabResult?.startTime !== startTime) {
                        // This query is no longer current, don't update state
                        return {error: err};
                    }

                    dispatch(
                        setQueryResult({
                            tabId,
                            result: {
                                ...currentTabResult,
                                type: 'execute',
                                error,
                                isLoading: false,
                                startTime,
                                endTime: Date.now(),
                                queryId: currentTabResult?.queryId || '',
                                streamingStatus: undefined,
                            },
                        }),
                    );

                    return {error: err};
                }
            },
        }),
        useSendQuery: build.mutation<
            {queryStats: QueryStats; queryId: string; historyQueryId?: string},
            SendQueryParams
        >({
            queryFn: async (
                {
                    tabId,
                    actionType = 'execute',
                    startTime,
                    query,
                    database,
                    querySettings = {},
                    enableTracingLevel,
                    queryId,
                    base64,
                    historyQueryId,
                },
                {signal, dispatch, getState},
            ) => {
                dispatch(
                    setQueryResult({
                        tabId,
                        result: {
                            type: actionType,
                            queryId,
                            isLoading: true,
                            startTime,
                        },
                    }),
                );

                const {action, syntax} = getActionAndSyntaxFromQueryMode(
                    actionType,
                    querySettings?.queryMode,
                );

                const finalQuery = prepareQueryWithPragmas(query, querySettings.pragmas);

                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: finalQuery,
                            database,
                            action,
                            syntax,
                            stats: querySettings.statisticsMode,
                            tracingLevel: getTracingLevelParam(querySettings, enableTracingLevel),
                            limit_rows: getLimitRowsParam(querySettings.limitRows),
                            transaction_mode: getTransactionModeParam(
                                querySettings.transactionMode,
                            ),
                            timeout: getTimeoutMsParam(querySettings.timeout),
                            query_id: queryId,
                            base64,
                            resource_pool: getResourcePoolParam(querySettings.resourcePool),
                        },
                        {signal},
                    );

                    if (isQueryErrorResponse(response)) {
                        const queryStats: QueryStats =
                            actionType === 'execute'
                                ? createExecuteQueryStats({}, startTime, 'failed')
                                : {};

                        dispatch(
                            setQueryResult({
                                tabId,
                                result: {
                                    type: actionType,
                                    error: response,
                                    isLoading: false,
                                    queryId,
                                    startTime,
                                    endTime: Date.now(),
                                },
                            }),
                        );
                        return {
                            error: {
                                error: response,
                                extra: {
                                    queryStats,
                                    queryId,
                                    historyQueryId,
                                },
                            },
                        };
                    }

                    const data = prepareQueryData(response);
                    data.traceId = response?._meta?.traceId;

                    const queryStats: QueryStats =
                        actionType === 'execute'
                            ? createExecuteQueryStats(data, startTime, 'completed')
                            : {};

                    dispatch(
                        setQueryResult({
                            tabId,
                            result: {
                                type: actionType,
                                data,
                                isLoading: false,
                                queryId,
                                startTime,
                                endTime: Date.now(),
                            },
                        }),
                    );
                    return {data: {queryStats, queryId, historyQueryId}};
                } catch (error) {
                    const state = getState() as RootState;
                    const currentTabResult = state.query.tabsById[tabId]?.result;

                    const queryStats: QueryStats =
                        actionType === 'execute'
                            ? createExecuteQueryStats(
                                  currentTabResult?.data ?? {},
                                  startTime,
                                  'failed',
                              )
                            : {};

                    const err = {
                        error,
                        extra: {
                            queryStats,
                            queryId,
                            historyQueryId,
                        },
                    };

                    if (currentTabResult?.startTime !== startTime) {
                        // This query is no longer current, don't update state
                        return {error: err};
                    }

                    dispatch(
                        setQueryResult({
                            tabId,
                            result: {
                                ...currentTabResult,
                                type: actionType,
                                error,
                                isLoading: false,
                                queryId,
                                startTime,
                                endTime: Date.now(),
                            },
                        }),
                    );
                    return {error: err};
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
