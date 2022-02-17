import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_CLUSTER = createRequestActionTypes('cluster', 'FETCH_CLUSTER');

const initialState = {loading: true, wasLoaded: false};

const cluster = function (state = initialState, action) {
    switch (action.type) {
        case FETCH_CLUSTER.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_CLUSTER.SUCCESS: {
            const {data} = action;
            const clusterInfo = data.cluster ? data.cluster.cluster : data;
            const clusterName = data.cluster?.title || data.Name;
            return {
                ...state,
                data: {
                    ...clusterInfo,
                    balancer: data.cluster?.balancer,
                    solomon: data.cluster?.solomon,
                    Name: clusterName,
                },
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_CLUSTER.FAILURE: {
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

export function getClusterInfo(clusterName) {
    return createApiRequest({
        request: window.api.getClusterInfo(clusterName),
        actions: FETCH_CLUSTER,
    });
}

export default cluster;
