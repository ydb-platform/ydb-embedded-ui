import type {Reducer} from '@reduxjs/toolkit';

import {settingsManager} from '../../services/settings';
import {TracingLevelNumber} from '../../types/api/query';
import type {ExecuteActions, Schemas} from '../../types/api/query';
import type {
    ExecuteQueryAction,
    ExecuteQueryState,
    ExecuteQueryStateSlice,
    QueryInHistory,
} from '../../types/store/executeQuery';
import type {
    IQueryResult,
    QueryMode,
    QueryRequestParams,
    QuerySettings,
    QuerySyntax,
} from '../../types/store/query';
import {QUERIES_HISTORY_KEY} from '../../utils/constants';
import {
    QUERY_MODES,
    QUERY_SYNTAX,
    isQueryErrorResponse,
    parseQueryAPIExecuteResponse,
} from '../../utils/query';
import {isNumeric} from '../../utils/utils';
import {createRequestActionTypes} from '../utils';

import {api} from './api';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

export const SEND_QUERY = createRequestActionTypes('query', 'SEND_QUERY');

const CHANGE_USER_INPUT = 'query/CHANGE_USER_INPUT';
const SAVE_QUERY_TO_HISTORY = 'query/SAVE_QUERY_TO_HISTORY';
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

        case SAVE_QUERY_TO_HISTORY: {
            const queryText = action.data.queryText;

            // Do not save explicit yql syntax value for easier further support (use yql by default)
            const syntax = action.data.mode === QUERY_MODES.pg ? QUERY_SYNTAX.pg : undefined;

            const newQueries = [...state.history.queries, {queryText, syntax}].slice(
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

        default:
            return state;
    }
};

interface SendQueryParams extends QueryRequestParams {
    querySettings?: Partial<QuerySettings>;
    schema?: Schemas;
}

export const executeQueryApi = api.injectEndpoints({
    endpoints: (build) => ({
        executeQuery: build.mutation<IQueryResult, SendQueryParams>({
            queryFn: async ({query, database, querySettings, schema = 'modern'}) => {
                let action: ExecuteActions = 'execute';
                let syntax: QuerySyntax = QUERY_SYNTAX.yql;

                if (querySettings?.queryMode === 'pg') {
                    action = 'execute-query';
                    syntax = QUERY_SYNTAX.pg;
                } else if (querySettings?.queryMode) {
                    action = `execute-${querySettings?.queryMode}`;
                }

                try {
                    const response = await window.api.sendQuery({
                        schema,
                        query,
                        database,
                        action,
                        syntax,
                        stats: querySettings?.statisticsMode ?? 'full',
                        tracingLevel: querySettings?.tracingLevel
                            ? TracingLevelNumber[querySettings?.tracingLevel]
                            : undefined,
                        transaction_mode: querySettings?.isolationLevel,
                        timeout: isNumeric(querySettings?.timeout)
                            ? Number(querySettings?.timeout) * 1000
                            : undefined,
                    });

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIExecuteResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});

export const saveQueryToHistory = (queryText: string, mode: QueryMode) => {
    return {
        type: SAVE_QUERY_TO_HISTORY,
        data: {queryText, mode},
    } as const;
};

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

export const selectQueriesHistory = (state: ExecuteQueryStateSlice): QueryInHistory[] => {
    return state.executeQuery.history.queries;
};

function getQueryInHistory(rawQuery: string | QueryInHistory) {
    if (typeof rawQuery === 'string') {
        return {
            queryText: rawQuery,
        };
    }
    return rawQuery;
}

export default executeQuery;
