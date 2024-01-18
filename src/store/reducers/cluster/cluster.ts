import type {Reducer} from 'redux';

import {createRequestActionTypes, createApiRequest} from '../../utils';
import type {ClusterAction, ClusterState} from './types';
import {createSelectClusterGroupsQuery, parseGroupsStatsQueryResponse} from './utils';

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
            const {clusterData, groupsStats} = action.data;

            return {
                ...state,
                data: clusterData,
                groupsStats,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_CLUSTER.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

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
    async function requestClusterData() {
        // Error here is handled by createApiRequest
        const clusterData = await window.api.getClusterInfo(clusterName);

        try {
            const clusterRoot = clusterData.Domain;

            // Without domain we cannot get stats from system tables
            if (!clusterRoot) {
                return {
                    clusterData,
                };
            }

            const query = createSelectClusterGroupsQuery(clusterRoot);

            // Normally query request should be fulfilled within 300-400ms even on very big clusters
            // Table with stats is supposed to be very small (less than 10 rows)
            // So we batch this request with cluster request to prevent possible layout shifts, if data is missing
            const groupsStatsResponse = await window.api.sendQuery({
                schema: 'modern',
                query: query,
                database: clusterRoot,
                action: 'execute-scan',
            });

            return {
                clusterData,
                groupsStats: parseGroupsStatsQueryResponse(groupsStatsResponse),
            };
        } catch {
            // Doesn't return groups stats on error
            // It could happen if user doesn't have access rights
            // Or there are no system tables in cluster root
            return {
                clusterData,
            };
        }
    }

    return createApiRequest({
        request: requestClusterData(),
        actions: FETCH_CLUSTER,
    });
}

export default cluster;
