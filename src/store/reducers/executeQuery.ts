import type {Reducer} from '@reduxjs/toolkit';

import type {ExecuteActions, Schemas} from '../../types/api/query';
import type {
    ExecuteQueryAction,
    ExecuteQueryState,
    ExecuteQueryStateSlice,
    QueryInHistory,
} from '../../types/store/executeQuery';
import type {QueryRequestParams, QueryMode, QuerySyntax} from '../../types/store/query';
import {QUERIES_HISTORY_KEY} from '../../utils/constants';
import {QUERY_MODES, QUERY_SYNTAX, parseQueryAPIExecuteResponse} from '../../utils/query';
import {parseQueryError} from '../../utils/error';
import {settingsManager} from '../../services/settings';

import {createRequestActionTypes, createApiRequest} from '../utils';

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
        case SEND_QUERY.REQUEST: {
            return {
                ...state,
                loading: true,
                data: undefined,
                error: undefined,
            };
        }
        case SEND_QUERY.SUCCESS: {
            return {
                ...state,
                data: action.data,
                stats: action.data.stats,
                loading: false,
                error: undefined,
            };
        }
        case SEND_QUERY.FAILURE: {
            return {
                ...state,
                error: parseQueryError(action.error),
                loading: false,
            };
        }

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
    mode?: QueryMode;
    schema?: Schemas;
}

export const sendExecuteQuery = ({query, database, mode, schema = 'modern'}: SendQueryParams) => {
    let action: ExecuteActions = 'execute';
    let syntax: QuerySyntax = QUERY_SYNTAX.yql;

    if (mode === 'pg') {
        action = 'execute-query';
        syntax = QUERY_SYNTAX.pg;
    } else if (mode) {
        action = `execute-${mode}`;
    }

    return createApiRequest({
        request: window.api.sendQuery({
            schema,
            query,
            database,
            action,
            syntax,
            stats: 'profile',
        }),
        actions: SEND_QUERY,
        dataHandler: parseQueryAPIExecuteResponse,
    });
};

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
