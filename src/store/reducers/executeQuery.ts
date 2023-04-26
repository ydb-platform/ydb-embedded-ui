import type {Reducer} from 'redux';

import type {ExecuteActions} from '../../types/api/query';
import type {
    ExecuteQueryAction,
    ExecuteQueryState,
    MonacoHotKeyAction,
} from '../../types/store/executeQuery';
import type {QueryRequestParams, QueryModes} from '../../types/store/query';
import {getValueFromLS, parseJson} from '../../utils/utils';
import {QUERIES_HISTORY_KEY} from '../../utils/constants';
import {parseQueryAPIExecuteResponse} from '../../utils/query';
import {parseQueryError} from '../../utils/error';
import '../../services/api';

import {createRequestActionTypes, createApiRequest} from '../utils';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

export const SEND_QUERY = createRequestActionTypes('query', 'SEND_QUERY');

const CHANGE_USER_INPUT = 'query/CHANGE_USER_INPUT';
const SAVE_QUERY_TO_HISTORY = 'query/SAVE_QUERY_TO_HISTORY';
const GO_TO_PREVIOUS_QUERY = 'query/GO_TO_PREVIOUS_QUERY';
const GO_TO_NEXT_QUERY = 'query/GO_TO_NEXT_QUERY';
const MONACO_HOT_KEY = 'query/MONACO_HOT_KEY';

const queriesHistoryInitial: string[] = parseJson(getValueFromLS(QUERIES_HISTORY_KEY, '[]'));

const sliceLimit = queriesHistoryInitial.length - MAXIMUM_QUERIES_IN_HISTORY;

export const MONACO_HOT_KEY_ACTIONS = {
    sendQuery: 'sendQuery',
    goPrev: 'goPrev',
    goNext: 'goNext',
    getExplain: 'getExplain',
} as const;

const initialState = {
    loading: false,
    input: '',
    history: {
        queries: queriesHistoryInitial.slice(sliceLimit < 0 ? 0 : sliceLimit),
        currentIndex:
            queriesHistoryInitial.length > MAXIMUM_QUERIES_IN_HISTORY
                ? MAXIMUM_QUERIES_IN_HISTORY - 1
                : queriesHistoryInitial.length - 1,
    },
    monacoHotKey: null,
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
            const query = action.data;
            const newQueries = [...state.history.queries, query].slice(
                state.history.queries.length >= MAXIMUM_QUERIES_IN_HISTORY ? 1 : 0,
            );
            window.localStorage.setItem(QUERIES_HISTORY_KEY, JSON.stringify(newQueries));
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
            const newCurrentIndex = Math.max(0, state.history.currentIndex - 1);

            return {
                ...state,
                history: {
                    ...state.history,
                    currentIndex: newCurrentIndex,
                },
            };
        }

        case GO_TO_NEXT_QUERY: {
            const lastIndexInHistory = state.history.queries.length - 1;
            const newCurrentIndex = Math.min(lastIndexInHistory, state.history.currentIndex + 1);

            return {
                ...state,
                history: {
                    ...state.history,
                    currentIndex: newCurrentIndex,
                },
            };
        }

        case MONACO_HOT_KEY: {
            return {
                ...state,
                monacoHotKey: action.data,
            };
        }

        default:
            return state;
    }
};

interface SendQueryParams extends QueryRequestParams {
    mode?: QueryModes;
}

export const sendExecuteQuery = ({query, database, mode}: SendQueryParams) => {
    const action: ExecuteActions = mode ? `execute-${mode}` : 'execute';

    return createApiRequest({
        request: window.api.sendQuery({
            schema: 'modern',
            query,
            database,
            action,
            stats: 'profile',
        }),
        actions: SEND_QUERY,
        dataHandler: parseQueryAPIExecuteResponse,
    });
};

export const saveQueryToHistory = (query: string) => {
    return {
        type: SAVE_QUERY_TO_HISTORY,
        data: query,
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

export const setMonacoHotKey = (value: MonacoHotKeyAction) => {
    return {
        type: MONACO_HOT_KEY,
        data: value,
    } as const;
};

export default executeQuery;
