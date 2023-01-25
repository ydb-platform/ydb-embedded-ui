import type {Reducer} from 'redux';
import {createSelector, Selector} from 'reselect';
import {escapeRegExp} from 'lodash/fp';

import '../../services/api';
import {ALL, HOUR_IN_SECONDS, IProblemFilterValues} from '../../utils/constants';
import {calcUptime, calcUptimeInSeconds} from '../../utils';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import type {
    INodesAction,
    INodesApiRequestParams,
    INodesHandledResponse,
    INodesPreparedEntity,
    INodesRootStateSlice,
    INodesState,
} from '../../types/store/nodes';
import {EFlag} from '../../types/api/enums';

import {createRequestActionTypes, createApiRequest} from '../utils';

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

export function getNodes({tenant, filter, type = 'any'}: INodesApiRequestParams) {
    return createApiRequest({
        request: window.api.getNodes({tenant, filter, type}),
        actions: FETCH_NODES,
        dataHandler: (data): INodesHandledResponse => {
            const rawNodes = data.Nodes || [];

            const preparedNodes = rawNodes.map((node) => {
                return {
                    ...node?.SystemState,
                    Tablets: node?.Tablets,
                    NodeId: node?.NodeId,
                    Uptime: calcUptime(node?.SystemState?.StartTime),
                    TenantName: node?.SystemState?.Tenants?.[0],
                };
            });

            return {
                Nodes: preparedNodes,
                TotalNodes: Number(data.TotalNodes) || preparedNodes.length,
            };
        },
    });
}

export function getComputeNodes(path: string) {
    return createApiRequest({
        request: window.api.getCompute(path),
        actions: FETCH_NODES,
        dataHandler: (data): INodesHandledResponse => {
            const preparedNodes: INodesPreparedEntity[] = [];

            if (data.Tenants) {
                for (const tenant of data.Tenants) {
                    if (tenant && tenant.Nodes) {
                        const tenantNodes = tenant.Nodes.map((node) => {
                            return {
                                ...node,
                                TenantName: tenant.Name,
                                SystemState: node?.Overall,
                                Uptime: calcUptime(node?.StartTime),
                            };
                        });

                        preparedNodes.push(...tenantNodes);
                    }
                }
            }

            return {
                Nodes: preparedNodes,
                TotalNodes: preparedNodes.length,
            };
        },
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

const getNodesUptimeFilter = (state: INodesRootStateSlice) => state.nodes.nodesUptimeFilter;
const getSearchValue = (state: INodesRootStateSlice) => state.nodes.searchValue;
const getNodesList = (state: INodesRootStateSlice) => state.nodes.data;

const filterNodesByProblemsStatus = (
    nodesList: INodesPreparedEntity[] = [],
    problemFilter: IProblemFilterValues,
) => {
    if (problemFilter === ALL) {
        return nodesList;
    }

    return nodesList.filter(({SystemState}) => {
        return SystemState && SystemState !== EFlag.Green;
    });
};

export const filterNodesByUptime = (
    nodesList: INodesPreparedEntity[] = [],
    nodesUptimeFilter: NodesUptimeFilterValues,
) => {
    if (nodesUptimeFilter === NodesUptimeFilterValues.All) {
        return nodesList;
    }
    return nodesList.filter(({StartTime}) => {
        return !StartTime || calcUptimeInSeconds(StartTime) < HOUR_IN_SECONDS;
    });
};

const filterNodesBySearchValue = (nodesList: INodesPreparedEntity[] = [], searchValue: string) => {
    if (!searchValue) {
        return nodesList;
    }
    const re = new RegExp(escapeRegExp(searchValue), 'i');

    return nodesList.filter((node) => {
        return node.Host ? re.test(node.Host) || re.test(String(node.NodeId)) : true;
    });
};

export const getFilteredPreparedNodesList: Selector<
    INodesRootStateSlice,
    INodesPreparedEntity[] | undefined
> = createSelector(
    [getNodesList, getNodesUptimeFilter, getSearchValue, (state) => state.settings.problemFilter],
    (nodesList, uptimeFilter, searchValue, problemFilter) => {
        let result = filterNodesByUptime(nodesList, uptimeFilter);
        result = filterNodesByProblemsStatus(result, problemFilter);
        result = filterNodesBySearchValue(result, searchValue);

        return result;
    },
);

export default nodes;
