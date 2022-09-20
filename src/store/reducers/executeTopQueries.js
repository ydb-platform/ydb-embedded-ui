import '../../services/api';

import {parseQueryAPIExecuteResponse} from '../../utils/query';

import {createRequestActionTypes, createApiRequest} from '../utils';

const SEND_QUERY = createRequestActionTypes('top-queries', 'SEND_QUERY');
const SET_QUERY_OPTIONS = createRequestActionTypes('top-queries', 'SET_QUERY_OPTIONS');

const initialState = {
    loading: false,
    wasLoaded: false,
};

const executeTopQueries = (state = initialState, action) => {
    switch (action.type) {
        case SEND_QUERY.REQUEST: {
            return {
                ...state,
                loading: true,
                error: undefined,
            };
        }
        case SEND_QUERY.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                error: undefined,
                wasLoaded: true,
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
        case SET_QUERY_OPTIONS:
            return {
                ...state,
                ...action.data,
            };
        default:
            return state;
    }
};

export const sendQuery = ({query, database, action}) => {
    return createApiRequest({
        request: window.api.sendQuery({schema: 'modern', query, database, action}),
        actions: SEND_QUERY,
        dataHandler: parseQueryAPIExecuteResponse,
    });
};

export function setQueryOptions(options) {
    return {
        type: SET_QUERY_OPTIONS,
        data: options,
    };
}

export default executeTopQueries;
