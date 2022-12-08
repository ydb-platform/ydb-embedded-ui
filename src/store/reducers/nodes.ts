import type {Reducer} from 'redux';

import '../../services/api';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {INodesAction, INodesRootStateSlice, INodesState} from '../../types/store/nodes';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_NODES = createRequestActionTypes('nodes', 'FETCH_NODES');

const CLEAR_NODES = 'nodes/CLEAR_NODES';
const SET_NODES_UPTIME_FILTER = 'nodes/SET_NODES_UPTIME_FILTER';
const SET_DATA_WAS_NOT_LOADED = 'nodes/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: true,
    wasLoaded: false,
    nodesUptimeFilter: NodesUptimeFilterValues.All,
};

const nodes: Reducer<INodesState, INodesAction> = (state = initialState, action) => {
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
        case CLEAR_NODES: {
            return {
                ...state,
                loading: true,
                data: undefined,
                wasLoaded: false,
                error: undefined,
            };
        }

        case SET_NODES_UPTIME_FILTER: {
            return {
                ...state,
                nodesUptimeFilter: action.data,
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

export function getNodes(path: string) {
    return createApiRequest({
        request: window.api.getNodes(path),
        actions: FETCH_NODES,
    });
}

export const clearNodes = () => ({type: CLEAR_NODES} as const);

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

export const getNodesUptimeFilter = (state: INodesRootStateSlice) => state.nodes.nodesUptimeFilter;

export default nodes;
