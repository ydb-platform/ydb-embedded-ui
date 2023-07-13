import type {Reducer} from 'redux';

import '../../../services/api';
import {NodesUptimeFilterValues} from '../../../utils/nodes';

import {createRequestActionTypes, createApiRequest} from '../../utils';

import type {NodesAction, NodesApiRequestParams, NodesState} from './types';
import {prepareComputeNodesData, prepareNodesData} from './utils';

export const FETCH_NODES = createRequestActionTypes('nodes', 'FETCH_NODES');

const RESET_NODES_STATE = 'nodes/RESET_NODES_STATE';
const SET_NODES_UPTIME_FILTER = 'nodes/SET_NODES_UPTIME_FILTER';
const SET_DATA_WAS_NOT_LOADED = 'nodes/SET_DATA_WAS_NOT_LOADED';
const SET_SEARCH_VALUE = 'nodes/SET_SEARCH_VALUE';

const initialState = {
    loading: false,
    wasLoaded: false,
    nodesUptimeFilter: NodesUptimeFilterValues.All,
    searchValue: '',
};

const nodes: Reducer<NodesState, NodesAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_NODES.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_NODES.SUCCESS: {
            return {
                ...state,
                data: action.data?.Nodes,
                totalNodes: action.data?.TotalNodes,
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
        case RESET_NODES_STATE: {
            return {
                ...state,
                loading: initialState.loading,
                wasLoaded: initialState.wasLoaded,
                nodesUptimeFilter: initialState.nodesUptimeFilter,
                searchValue: initialState.searchValue,
            };
        }
        case SET_NODES_UPTIME_FILTER: {
            return {
                ...state,
                nodesUptimeFilter: action.data,
            };
        }
        case SET_SEARCH_VALUE: {
            return {
                ...state,
                searchValue: action.data,
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

export function getNodes({tenant, visibleEntities, type = 'any'}: NodesApiRequestParams) {
    return createApiRequest({
        request: window.api.getNodes({tenant, visibleEntities, type}),
        actions: FETCH_NODES,
        dataHandler: prepareNodesData,
    });
}

export function getComputeNodes(path: string) {
    return createApiRequest({
        request: window.api.getCompute(path),
        actions: FETCH_NODES,
        dataHandler: prepareComputeNodesData,
    });
}

export const resetNodesState = () => {
    return {
        type: RESET_NODES_STATE,
    } as const;
};

export const setNodesUptimeFilter = (value: NodesUptimeFilterValues) =>
    ({
        type: SET_NODES_UPTIME_FILTER,
        data: value,
    } as const);

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export const setSearchValue = (value: string) => {
    return {
        type: SET_SEARCH_VALUE,
        data: value,
    } as const;
};

export default nodes;
