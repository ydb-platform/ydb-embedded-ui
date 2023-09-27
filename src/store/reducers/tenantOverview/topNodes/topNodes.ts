import type {Reducer} from 'redux';

import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {EVersion} from '../../../../types/api/compute';
import {createApiRequest, createRequestActionTypes} from '../../../utils';
import {prepareNodesData} from '../../nodes/utils';
import type {ComputeApiRequestParams, NodesApiRequestParams} from '../../nodes/types';
import type {TopNodesAction, TopNodesState, TopNodesStateSlice} from './types';
import {prepareTopComputeNodesData} from './utils';

export const FETCH_TOP_NODES = createRequestActionTypes('nodes', 'FETCH_TOP_NODES');
const SET_DATA_WAS_NOT_LOADED = 'nodes/SET_TOP_NODES_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
};

const topNodes: Reducer<TopNodesState, TopNodesAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TOP_NODES.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TOP_NODES.SUCCESS: {
            return {
                ...state,
                data: action.data?.Nodes,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_TOP_NODES.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        default:
            return state;
    }
};

const concurrentId = 'getNodes';

export function getTopNodes({
    type = 'any',
    sortOrder = -1,
    sortValue = 'LoadAverage',
    limit = TENANT_OVERVIEW_TABLES_LIMIT,
    ...params
}: NodesApiRequestParams) {
    return createApiRequest({
        request: window.api.getNodes(
            {type, sortOrder, sortValue, limit, ...params},
            {concurrentId},
        ),
        actions: FETCH_TOP_NODES,
        dataHandler: prepareNodesData,
    });
}

export function getTopComputeNodes({
    sortOrder = -1,
    sortValue = 'LoadAverage',
    limit = TENANT_OVERVIEW_TABLES_LIMIT,
    version = EVersion.v2,
    ...params
}: ComputeApiRequestParams) {
    return createApiRequest({
        request: window.api.getCompute(
            {sortOrder, sortValue, limit, version, ...params},
            {concurrentId},
        ),
        actions: FETCH_TOP_NODES,
        dataHandler: prepareTopComputeNodesData,
    });
}

export const selectTopNodes = (state: TopNodesStateSlice) => state.topNodes.data;

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export default topNodes;
