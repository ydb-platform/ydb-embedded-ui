import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import {getValueFromLS, parseJson} from '../../utils/utils';
import {QUERIES_HISTORY_KEY} from '../../utils/constants';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

const SEND_QUERY = createRequestActionTypes('query', 'SEND_QUERY');
const CHANGE_USER_INPUT = 'query/CHANGE_USER_INPUT';
const SAVE_QUERY_TO_HISTORY = 'query/SAVE_QUERY_TO_HISTORY';
const GO_TO_PREVIOUS_QUERY = 'query/GO_TO_PREVIOUS_QUERY';
const GO_TO_NEXT_QUERY = 'query/GO_TO_NEXT_QUERY';
const SELECT_RUN_ACTION = 'query/SELECT_RUN_ACTION';
const MONACO_HOT_KEY = 'query/MONACO_HOT_KEY';

const queriesHistoryInitial = parseJson(getValueFromLS(QUERIES_HISTORY_KEY, '[]'));

const sliceLimit = queriesHistoryInitial.length - MAXIMUM_QUERIES_IN_HISTORY;

export const RUN_ACTIONS_VALUES = {
    script: 'execute-script',
    scan: 'execute-scan',
};

export const MONACO_HOT_KEY_ACTIONS = {
    sendQuery: 'sendQuery',
    goPrev: 'goPrev',
    goNext: 'goNext',
    getExplain: 'getExplain',
};

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
    runAction: RUN_ACTIONS_VALUES.script,
    monacoHotKey: null,
};

const executeQuery = (state = initialState, action) => {
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
                data: action.data.result ?? action.data,
                stats: action.data.stats,
                loading: false,
                error: undefined,
            };
        }
        // 401 Unauthorized error is handled by GenericAPI
        case SEND_QUERY.FAILURE: {
            return {
                ...state,
                error: action.error || 'Unauthorized',
                loading: false,
            };
        }

        case SELECT_RUN_ACTION: {
            return {
                ...state,
                runAction: action.data,
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

export const sendQuery = ({query, database, action}) => {
    return createApiRequest({
        request: window.api.sendQuery({query, database, action, stats: 'profile'}),
        actions: SEND_QUERY,
        dataHandler: (result) => {
            const resultData = result.result ?? result;
            if (resultData && typeof resultData === 'string') {
                throw 'Unexpected token in JSON.';
            }
            return result;
        },
    });
};

export const saveQueryToHistory = (query) => {
    return {
        type: SAVE_QUERY_TO_HISTORY,
        data: query,
    };
};

export const selectRunAction = (value) => {
    return {
        type: SELECT_RUN_ACTION,
        data: value,
    };
};

export const goToPreviousQuery = () => {
    return {
        type: GO_TO_PREVIOUS_QUERY,
    };
};

export const goToNextQuery = () => {
    return {
        type: GO_TO_NEXT_QUERY,
    };
};

export const changeUserInput = ({input}) => {
    return (dispatch) => {
        dispatch({type: CHANGE_USER_INPUT, data: {input}});
    };
};

export const setMonacoHotKey = (value) => {
    return {
        type: MONACO_HOT_KEY,
        data: value,
    };
};

export default executeQuery;
