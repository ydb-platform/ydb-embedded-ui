import type {OrderType} from '@gravity-ui/react-data-table';

import type {
    EVersion,
    TTabletStateInfo as TComputeTabletStateInfo,
} from '../../../types/api/compute';
import type {EFlag} from '../../../types/api/enums';
import type {IResponseError} from '../../../types/api/error';
import type {TEndpoint, TPoolStats} from '../../../types/api/nodes';
import type {TTabletStateInfo as TFullTabletStateInfo} from '../../../types/api/tablet';
import type {NodesSortValue, NodesUptimeFilterValues} from '../../../utils/nodes';
import type {ApiRequestAction} from '../../utils';
import type {VisibleEntities} from '../storage/types';

import type {
    FETCH_NODES,
    resetNodesState,
    setDataWasNotLoaded,
    setNodesUptimeFilter,
    setSearchValue,
    setSort,
} from './nodes';

// Since nodes from different endpoints can have different types,
// This type describes fields, that are expected by tables with nodes
export interface NodesPreparedEntity {
    NodeId: number;
    Host?: string;
    SystemState?: EFlag;
    DC?: string;
    Rack?: string;
    Version?: string;
    TenantName?: string;

    StartTime?: string;
    Uptime: string;
    DisconnectTime?: string;

    MemoryUsed?: string;
    MemoryUsedInAlloc?: string;
    MemoryLimit?: string;

    SharedCacheUsed?: string;
    SharedCacheLimit?: string | number;

    PoolStats?: TPoolStats[];
    LoadAverage?: number[];
    Tablets?: TFullTabletStateInfo[] | TComputeTabletStateInfo[];
    Endpoints?: TEndpoint[];

    TotalSessions?: number;
}

export interface NodesState {
    loading: boolean;
    wasLoaded: boolean;
    nodesUptimeFilter: NodesUptimeFilterValues;
    searchValue: string;
    sortValue?: NodesSortValue;
    sortOrder?: OrderType;
    data?: NodesPreparedEntity[];
    totalNodes?: number;
    error?: IResponseError;
}

export type NodeType = 'static' | 'dynamic' | 'any';

export interface NodesSortParams {
    sortOrder?: OrderType;
    sortValue?: NodesSortValue;
}

export interface NodesGeneralRequestParams extends NodesSortParams {
    filter?: string; // NodeId or Host
    uptime?: number; // return nodes with less uptime in seconds
    problems_only?: boolean; // return nodes with SystemState !== EFlag.Green

    offset?: number;
    limit?: number;
}

export interface NodesApiRequestParams extends NodesGeneralRequestParams {
    node_id?: number | string; // get only specific node
    path?: string;
    tenant?: string;
    type?: NodeType;
    visibleEntities?: VisibleEntities; // "with" param
    storage?: boolean;
    tablets?: boolean;
}

export interface ComputeApiRequestParams extends NodesGeneralRequestParams {
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
          | ReturnType<typeof setSort>
          | ReturnType<typeof resetNodesState>
      );

export interface NodesStateSlice {
    nodes: NodesState;
}
