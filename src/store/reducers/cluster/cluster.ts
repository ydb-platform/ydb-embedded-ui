import type {Reducer} from 'redux';

import '../../../services/api';
import {createRequestActionTypes, createApiRequest} from '../../utils';
import type {ClusterAction, ClusterState} from './types';

export const FETCH_CLUSTER = createRequestActionTypes('cluster', 'FETCH_CLUSTER');

const initialState = {loading: true, wasLoaded: false};

const cluster: Reducer<ClusterState, ClusterAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_CLUSTER.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_CLUSTER.SUCCESS: {
            return {
                ...state,
                data: action.data,
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

export function getClusterInfo(clusterName?: string) {
    return createApiRequest({
        request: window.api.getClusterInfo(clusterName),
        actions: FETCH_CLUSTER,
    });
}

export default cluster;
