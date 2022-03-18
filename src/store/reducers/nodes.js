import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_NODES = createRequestActionTypes('nodes', 'FETCH_NODES');

const nodes = function z(state = {loading: true, wasLoaded: false}, action) {
    switch (action.type) {
        case FETCH_NODES.REQUEST: {
            return {
                ...state,
                loading: true,
                requestTime: new Date().getTime(),
            };
        }
        case FETCH_NODES.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_NODES.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case 'CLEAR_NODES': {
            return {
                ...state,
                loading: true,
                data: undefined,
                wasLoaded: false,
                requestTime: new Date().getTime(),
                error: undefined,
            };
        }
        default:
            return state;
    }
};

export function getNodes(path) {
    return createApiRequest({
        request: window.api.getNodes(path),
        actions: FETCH_NODES,
    });
}

export const clearNodes = () => ({type: 'CLEAR_NODES'});

export default nodes;
