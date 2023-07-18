import type {IResponseError} from '../../../types/api/error';
import type {TEndpoint, TPoolStats} from '../../../types/api/nodes';
import type {
    EVersion,
    TTabletStateInfo as TComputeTabletStateInfo,
} from '../../../types/api/compute';
import type {TTabletStateInfo as TFullTabletStateInfo} from '../../../types/api/tablet';
import type {EFlag} from '../../../types/api/enums';
import type {ApiRequestAction} from '../../utils';
import type {VisibleEntities} from '../storage/types';

import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {
    FETCH_NODES,
    resetNodesState,
    setDataWasNotLoaded,
    setNodesUptimeFilter,
    setSearchValue,
} from './nodes';

// Since nodes from different endpoints can have different types,
// This type describes fields, that are expected by tables with nodes
export interface NodesPreparedEntity {
    NodeId: number;
    Host?: string;
    SystemState?: EFlag;
    DataCenter?: string;
    Rack?: string;
    Version?: string;
    StartTime?: string;
    Uptime: string;
    MemoryUsed?: string;
    PoolStats?: TPoolStats[];
    LoadAverage?: number[];
    Tablets?: TFullTabletStateInfo[] | TComputeTabletStateInfo[];
    TenantName?: string;
    Endpoints?: TEndpoint[];
}

export interface NodesState {
    loading: boolean;
    wasLoaded: boolean;
    nodesUptimeFilter: NodesUptimeFilterValues;
    searchValue: string;
    data?: NodesPreparedEntity[];
    totalNodes?: number;
    error?: IResponseError;
}

export type NodeType = 'static' | 'dynamic' | 'any';

interface RequestParams {
    filter?: string; // NodeId or Host
    uptime?: number; // return nodes with less uptime in seconds
    problems_only?: boolean; // return nodes with SystemState !== EFlag.Green
    sort?: string; // Sort by one of ESort params (may differ for /nodes and /compute)

    offser?: number;
    limit?: number;
}

export interface NodesApiRequestParams extends RequestParams {
    tenant?: string;
    type?: NodeType;
    visibleEntities?: VisibleEntities; // "with" param
    storage?: boolean;
    tablets?: boolean;
}

export interface ComputeApiRequestParams extends RequestParams {
    path: string;
    version?: EVersion; // only v2 works with filters
}

export interface NodesHandledResponse {
    Nodes?: NodesPreparedEntity[];
    TotalNodes: number;
    FoundNodes?: number;
}

type NodesApiRequestAction = ApiRequestAction<
    typeof FETCH_NODES,
    NodesHandledResponse,
    IResponseError
>;

export type NodesAction =
    | NodesApiRequestAction
    | (
          | ReturnType<typeof setDataWasNotLoaded>
          | ReturnType<typeof setNodesUptimeFilter>
          | ReturnType<typeof setSearchValue>
          | ReturnType<typeof resetNodesState>
      );

export interface NodesStateSlice {
    nodes: NodesState;
}
