import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import {NodesUptimeFilterValues} from '../../utils/nodes';

const FETCH_NODES = createRequestActionTypes('nodes', 'FETCH_NODES');

const CLEAR_NODES = 'nodes/CLEAR_NODES';
const SET_NODES_UPTIME_FILTER = 'nodes/SET_NODES_UPTIME_FILTER';
const SET_DATA_WAS_NOT_LOADED = 'nodes/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: true,
    wasLoaded: false,
    nodesUptimeFilter: NodesUptimeFilterValues.All,
};

const nodes = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_NODES.REQUEST: {
            return {
                ...state,
                loading: true,
                requestTime: new Date().getTime(),
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
                requestTime: new Date().getTime(),
                error: undefined,
            };
        }

        case SET_NODES_UPTIME_FILTER: {
            return {...state, nodesUptimeFilter: action.data};
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

export function getNodes(path) {
    return createApiRequest({
        request: window.api.getNodes(path),
        actions: FETCH_NODES,
    });
}

export const clearNodes = () => ({type: CLEAR_NODES});

export const setNodesUptimeFilter = (value) => ({
    type: SET_NODES_UPTIME_FILTER,
    data: value,
});

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    };
};

export const getNodesUptimeFilter = (state) => state.nodes.nodesUptimeFilter;

export default nodes;
