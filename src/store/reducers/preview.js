import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const SEND_QUERY = createRequestActionTypes('preview', 'SEND_QUERY');
const SET_QUERY_OPTIONS = createRequestActionTypes('preview', 'SET_QUERY_OPTIONS');

const initialState = {
    loading: false,
    wasLoaded: false,
};

const preview = (state = initialState, action) => {
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
        request: window.api.sendQuery(query, database, action),
        actions: SEND_QUERY,
        dataHandler: (data) => {
            if (!Array.isArray(data)) {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    return [];
                }
            }

            return data;
        },
    });
};

export function setQueryOptions(options) {
    return {
        type: SET_QUERY_OPTIONS,
        data: options,
    };
}

export default preview;
