import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {settingsManager} from '../../../services/settings';
import {TracingLevelNumber} from '../../../types/api/query';
import type {ExecuteActions} from '../../../types/api/query';
import type {QueryRequestParams, QuerySettings, QuerySyntax} from '../../../types/store/query';
import {QUERIES_HISTORY_KEY} from '../../../utils/constants';
import {
    QUERY_SYNTAX,
    isQueryErrorResponse,
    parseQueryAPIExecuteResponse,
} from '../../../utils/query';
import {isNumeric} from '../../../utils/utils';
import {api} from '../api';

import type {ExecuteQueryState, QueryInHistory, QueryResult} from './executeQueryTypes';
import {ResultType} from './executeQueryTypes';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

const queriesHistoryInitial = settingsManager.readUserSettingsValue(
    QUERIES_HISTORY_KEY,
    [],
) as string[];

const sliceLimit = queriesHistoryInitial.length - MAXIMUM_QUERIES_IN_HISTORY;

const initialState: ExecuteQueryState = {
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
    name: 'executeQuery',
    initialState,
    reducers: {
        changeUserInput: (state, action: PayloadAction<{input: string}>) => {
            state.input = action.payload.input;
        },
        setQueryTraceReady: (state) => {
            if (state.result) {
                state.result.isTraceReady = true;
            }
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
    setQueryTraceReady,
    setQueryResult,
    saveQueryToHistory,
    updateQueryInHistory,
    goToPreviousQuery,
    goToNextQuery,
    setTenantPath,
    setQueryHistoryFilter,
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

export const executeQueryApi = api.injectEndpoints({
    endpoints: (build) => ({
        executeQuery: build.mutation<null, SendQueryParams>({
            queryFn: async (
                {query, database, querySettings = {}, enableTracingLevel, queryId},
                {signal, dispatch},
            ) => {
                let action: ExecuteActions = 'execute';
                let syntax: QuerySyntax = QUERY_SYNTAX.yql;

                dispatch(setQueryResult({type: ResultType.EXECUTE, queryId, isLoading: true}));

                if (querySettings.queryMode === 'pg') {
                    action = 'execute-query';
                    syntax = QUERY_SYNTAX.pg;
                } else if (querySettings.queryMode) {
                    action = `execute-${querySettings.queryMode}`;
                }

                try {
                    const timeStart = Date.now();
                    const response = await window.api.sendQuery(
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
                                type: ResultType.EXECUTE,
                                error: response,
                                isLoading: false,
                                queryId,
                            }),
                        );
                        return {error: response};
                    }

                    const data = parseQueryAPIExecuteResponse(response);
                    data.traceId = response?._meta?.traceId;

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
                    dispatch(
                        setQueryResult({
                            type: ResultType.EXECUTE,
                            data,
                            isLoading: false,
                            queryId,
                        }),
                    );
                    return {data: null};
                } catch (error) {
                    dispatch(
                        setQueryResult({
                            type: ResultType.EXECUTE,
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

function getQueryInHistory(rawQuery: string | QueryInHistory) {
    if (typeof rawQuery === 'string') {
        return {
            queryText: rawQuery,
        };
    }
    return rawQuery;
}
