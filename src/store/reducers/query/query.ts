import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {settingsManager} from '../../../services/settings';
import {TracingLevelNumber} from '../../../types/api/query';
import type {QueryAction, QueryRequestParams, QuerySettings} from '../../../types/store/query';
import {QUERIES_HISTORY_KEY} from '../../../utils/constants';
import {isQueryErrorResponse} from '../../../utils/query';
import {isNumeric} from '../../../utils/utils';
import {api} from '../api';

import {prepareQueryData} from './prepareQueryData';
import type {QueryResult, QueryState} from './types';
import {getActionAndSyntaxFromQueryMode, getQueryInHistory} from './utils';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

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

export const queryApi = api.injectEndpoints({
    endpoints: (build) => ({
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
                dispatch(setQueryResult({type: actionType, queryId, isLoading: true}));

                const {action, syntax} = getActionAndSyntaxFromQueryMode(
                    actionType,
                    querySettings?.queryMode,
                );

                try {
                    const timeStart = Date.now();
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
