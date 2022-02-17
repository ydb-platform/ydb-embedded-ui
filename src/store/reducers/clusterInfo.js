import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_CLUSTER = createRequestActionTypes('cluster', 'FETCH_CLUSTER');

const initialState = {loading: false};

const clusterInfo = function (state = initialState, action) {
    switch (action.type) {
        case FETCH_CLUSTER.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_CLUSTER.SUCCESS: {
            const {data = {}} = action;

            return {
                ...state,
                ...data,
                loading: false,
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

export function getCluster(name) {
    return createApiRequest({
        request: window.api.getClustersList(),
        actions: FETCH_CLUSTER,
        dataHandler: ({clusters = []}) => {
            return clusters.filter((item) => item.name === name)[0];
        },
    });
}

export default clusterInfo;
