import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_ALL_NODES_NETWORK = createRequestActionTypes(
    'ALL_NODES_NETWORK',
    'FETCH_ALL_NODES_NETWORK',
);

const network = (state = {data: {}, loading: true, wasLoaded: false}, action) => {
    switch (action.type) {
        case FETCH_ALL_NODES_NETWORK.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_ALL_NODES_NETWORK.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_ALL_NODES_NETWORK.FAILURE: {
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

export const getNetworkInfo = (tenant) => {
    return createApiRequest({
        request: window.api.getNetwork(tenant),
        actions: FETCH_ALL_NODES_NETWORK,
    });
};

export default network;
