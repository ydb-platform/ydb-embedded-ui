import type {Reducer} from '@reduxjs/toolkit';

import {createRequestActionTypes, createApiRequest} from '../../utils';

import type {ClusterNodesAction, ClusterNodesState, PreparedClusterNode} from './types';

import {calcUptime} from '../../../utils/dataFormatters/dataFormatters';

export const FETCH_CLUSTER_NODES = createRequestActionTypes('cluster', 'FETCH_CLUSTER_NODES');

const initialState = {loading: false, wasLoaded: false};

const clusterNodes: Reducer<ClusterNodesState, ClusterNodesAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case FETCH_CLUSTER_NODES.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_CLUSTER_NODES.SUCCESS: {
            const {data = []} = action;

            return {
                ...state,
                nodes: data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_CLUSTER_NODES.FAILURE: {
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

export function getClusterNodes() {
    return createApiRequest({
        request: window.api.getClusterNodes(),
        actions: FETCH_CLUSTER_NODES,
        dataHandler: (data): PreparedClusterNode[] => {
            const {SystemStateInfo: nodes = []} = data;
            return nodes.map((node) => {
                return {
                    ...node,
                    uptime: calcUptime(node.StartTime),
                };
            });
        },
    });
}

export default clusterNodes;
