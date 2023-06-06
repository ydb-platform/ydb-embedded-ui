import {Reducer} from 'redux';

import '../../../services/api';
import {createRequestActionTypes, createApiRequest} from '../../utils';

import type {NodeAction, NodeState} from './types';

export const FETCH_NODE = createRequestActionTypes('node', 'FETCH_NODE');
export const FETCH_NODE_STRUCTURE = createRequestActionTypes('node', 'FETCH_NODE_STRUCTURE');

const RESET_NODE = 'node/RESET_NODE';

const initialState = {
    data: {},
    loading: true,
    wasLoaded: false,
    nodeStructure: {},
    loadingStructure: true,
    wasLoadedStructure: false,
};

const node: Reducer<NodeState, NodeAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_NODE.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_NODE.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_NODE.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case FETCH_NODE_STRUCTURE.REQUEST: {
            return {
                ...state,
                loadingStructure: true,
            };
        }
        case FETCH_NODE_STRUCTURE.SUCCESS: {
            return {
                ...state,
                nodeStructure: action.data,
                loadingStructure: false,
                wasLoadedStructure: true,
                errorStructure: undefined,
            };
        }
        case FETCH_NODE_STRUCTURE.FAILURE: {
            return {
                ...state,
                errorStructure: action.error,
                loadingStructure: false,
            };
        }
        case RESET_NODE: {
            return {
                ...state,
                data: {},
                wasLoaded: false,
                nodeStructure: {},
                wasLoadedStructure: false,
            };
        }
        default:
            return state;
    }
};

export const getNodeInfo = (id: string) => {
    return createApiRequest({
        request: window.api.getNodeInfo(id),
        actions: FETCH_NODE,
    });
};

export const getNodeStructure = (nodeId: string) => {
    return createApiRequest({
        request: window.api.getStorageInfo({nodeId}, {concurrentId: 'getNodeStructure'}),
        actions: FETCH_NODE_STRUCTURE,
    });
};

export function resetNode() {
    return {
        type: RESET_NODE,
    } as const;
}

export default node;
