import type {Reducer} from '@reduxjs/toolkit';

import {settingsManager} from '../../services/settings';
import {TracingLevelNumber} from '../../types/api/query';
import type {ExecuteActions, Schemas} from '../../types/api/query';
import {ResultType} from '../../types/store/executeQuery';
import type {
    ExecuteQueryAction,
    ExecuteQueryState,
    ExecuteQueryStateSlice,
    QueryInHistory,
    QueryResult,
} from '../../types/store/executeQuery';
import type {
    IQueryResult,
    QueryRequestParams,
    QuerySettings,
    QuerySyntax,
} from '../../types/store/query';
import {QUERIES_HISTORY_KEY} from '../../utils/constants';
import {QUERY_SYNTAX, isQueryErrorResponse, parseQueryAPIExecuteResponse} from '../../utils/query';
import {isNumeric} from '../../utils/utils';

import {api} from './api';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

const CHANGE_USER_INPUT = 'query/CHANGE_USER_INPUT';
const SET_QUERY_RESULT = 'query/SET_QUERY_RESULT';
const SAVE_QUERY_TO_HISTORY = 'query/SAVE_QUERY_TO_HISTORY';
const UPDATE_QUERY_IN_HISTORY = 'query/UPDATE_QUERY_IN_HISTORY';
const SET_QUERY_HISTORY_FILTER = 'query/SET_QUERY_HISTORY_FILTER';
const GO_TO_PREVIOUS_QUERY = 'query/GO_TO_PREVIOUS_QUERY';
const GO_TO_NEXT_QUERY = 'query/GO_TO_NEXT_QUERY';
const SET_TENANT_PATH = 'query/SET_TENANT_PATH';

const queriesHistoryInitial = settingsManager.readUserSettingsValue(
    QUERIES_HISTORY_KEY,
    [],
) as string[];

const sliceLimit = queriesHistoryInitial.length - MAXIMUM_QUERIES_IN_HISTORY;

const initialState = {
    loading: false,
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

const executeQuery: Reducer<ExecuteQueryState, ExecuteQueryAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case CHANGE_USER_INPUT: {
            return {
                ...state,
                input: action.data.input,
            };
        }

        case SET_QUERY_RESULT: {
            return {
                ...state,
                result: action.data,
            };
        }

        case SAVE_QUERY_TO_HISTORY: {
            const {queryText, queryId} = action.data;

            const newQueries = [...state.history.queries, {queryText, queryId}].slice(
                state.history.queries.length >= MAXIMUM_QUERIES_IN_HISTORY ? 1 : 0,
            );
            settingsManager.setUserSettingsValue(QUERIES_HISTORY_KEY, newQueries);
            const currentIndex = newQueries.length - 1;

            return {
                ...state,
                history: {
                    queries: newQueries,
                    currentIndex,
                },
            };
        }

        case UPDATE_QUERY_IN_HISTORY: {
            const {queryId, stats} = action.data;

            if (!stats) {
                return state;
            }

            const index = state.history.queries.findIndex((item) => item.queryId === queryId);

            if (index === -1) {
                return state;
            }

            const newQueries = [...state.history.queries];
            const {durationUs, endTime} = stats;
            newQueries.splice(index, 1, {
                ...state.history.queries[index],
                durationUs,
                endTime,
            });

            settingsManager.setUserSettingsValue(QUERIES_HISTORY_KEY, newQueries);

            return {
                ...state,
                history: {
                    ...state.history,
                    queries: newQueries,
                },
            };
        }

        case GO_TO_PREVIOUS_QUERY: {
            const currentIndex = state.history.currentIndex;
            if (currentIndex <= 0) {
                return state;
            }
            const newCurrentIndex = currentIndex - 1;
            const query = state.history.queries[newCurrentIndex];

            return {
                ...state,
                history: {
                    ...state.history,
                    currentIndex: newCurrentIndex,
                },
                input: query.queryText,
            };
        }

        case GO_TO_NEXT_QUERY: {
            const lastIndexInHistory = state.history.queries.length - 1;
            const currentIndex = state.history.currentIndex;
            if (currentIndex >= lastIndexInHistory) {
                return state;
            }
            const newCurrentIndex = currentIndex + 1;
            const query = state.history.queries[newCurrentIndex];

            return {
                ...state,
                history: {
                    ...state.history,
                    currentIndex: newCurrentIndex,
                },
                input: query.queryText,
            };
        }

        case SET_TENANT_PATH: {
            return {
                ...state,
                tenantPath: action.data,
            };
        }

        case SET_QUERY_HISTORY_FILTER: {
            return {
                ...state,
                history: {
                    ...state.history,
                    filter: action.data.filter,
                },
            };
        }

        default:
            return state;
    }
};

interface SendQueryParams extends QueryRequestParams {
    queryId: string;
    querySettings?: Partial<QuerySettings>;
    schema?: Schemas;
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
        executeQuery: build.mutation<IQueryResult, SendQueryParams>({
            queryFn: async (
                {
                    query,
                    database,
                    querySettings = {},
                    schema = 'modern',
                    enableTracingLevel,
                    queryId,
                },
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
                            schema,
                            query,
                            database,
                            action,
                            syntax,
                            stats: querySettings.statisticsMode,
                            tracingLevel:
                                querySettings.tracingLevel && enableTracingLevel
                                    ? TracingLevelNumber[querySettings.tracingLevel]
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
                    data.traceId = response._meta?.traceId;

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

                    dispatch(updateQueryInHistory(queryStats, queryId));
                    dispatch(
                        setQueryResult({
                            type: ResultType.EXECUTE,
                            data,
                            isLoading: false,
                            queryId,
                        }),
                    );
                    return {data};
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

export const saveQueryToHistory = (queryText: string, queryId: string) => {
    return {
        type: SAVE_QUERY_TO_HISTORY,
        data: {queryText, queryId},
    } as const;
};

export function updateQueryInHistory(stats: QueryStats, queryId: string) {
    return {
        type: UPDATE_QUERY_IN_HISTORY,
        data: {queryId, stats},
    } as const;
}

export function setQueryResult(data?: QueryResult) {
    return {
        type: SET_QUERY_RESULT,
        data,
    } as const;
}

export const goToPreviousQuery = () => {
    return {
        type: GO_TO_PREVIOUS_QUERY,
    } as const;
};

export const goToNextQuery = () => {
    return {
        type: GO_TO_NEXT_QUERY,
    } as const;
};

export const changeUserInput = ({input}: {input: string}) => {
    return {
        type: CHANGE_USER_INPUT,
        data: {input},
    } as const;
};

export const setTenantPath = (value: string) => {
    return {
        type: SET_TENANT_PATH,
        data: value,
    } as const;
};

export const selectQueriesHistoryFilter = (state: ExecuteQueryStateSlice): string => {
    return state.executeQuery.history.filter || '';
};

export const selectQueriesHistory = (state: ExecuteQueryStateSlice): QueryInHistory[] => {
    const items = state.executeQuery.history.queries;
    const filter = state.executeQuery.history.filter?.toLowerCase();

    return filter ? items.filter((item) => item.queryText.toLowerCase().includes(filter)) : items;
};

function getQueryInHistory(rawQuery: string | QueryInHistory) {
    if (typeof rawQuery === 'string') {
        return {
            queryText: rawQuery,
        };
    }
    return rawQuery;
}

export const setQueryHistoryFilter = (filter: string) => {
    return {
        type: SET_QUERY_HISTORY_FILTER,
        data: {filter},
    } as const;
};

export default executeQuery;
