import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_NODE = createRequestActionTypes('NODE', 'FETCH_NODE');

const NODE = (state = {data: {}, loading: true, wasLoaded: false}, action) => {
    switch (action.type) {
        case FETCH_NODE.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_NODE.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_NODE.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        default:
            return state;
    }
};

export const getNodeInfo = (id) => {
    return createApiRequest({
        request: window.api.getNodeInfo(id),
        actions: FETCH_NODE,
    });
};

export default NODE;
