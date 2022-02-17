import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_POOL = createRequestActionTypes('pool', 'FETCH_POOL');

const pool = function z(state = {loading: true, wasLoaded: false}, action) {
    switch (action.type) {
        case FETCH_POOL.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_POOL.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_POOL.FAILURE: {
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

export function getPoolInfo(poolName) {
    return createApiRequest({
        request: window.api.getPoolInfo(poolName),
        actions: FETCH_POOL,
    });
}

export default pool;
