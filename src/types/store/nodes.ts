import type {IResponseError} from '../api/error';
import type {TEndpoint, TPoolStats} from '../api/nodes';
import type {TTabletStateInfo as TComputeTabletStateInfo} from '../api/compute';
import type {TTabletStateInfo as TFullTabletStateInfo} from '../api/tablet';
import type {EFlag} from '../api/enums';

import {NodesUptimeFilterValues} from '../../utils/nodes';
import {
    FETCH_NODES,
    resetNodesState,
    setDataWasNotLoaded,
    setNodesUptimeFilter,
    setSearchValue,
} from '../../store/reducers/nodes';
import {ApiRequestAction} from '../../store/utils';

// Since nodes from different endpoints can have different types,
// This type describes fields, that are expected by tables with nodes
export interface INodesPreparedEntity {
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

export interface INodesState {
    loading: boolean;
    wasLoaded: boolean;
    nodesUptimeFilter: NodesUptimeFilterValues;
    searchValue: string;
    data?: INodesPreparedEntity[];
    totalNodes?: number;
    error?: IResponseError;
}

type INodesApiRequestNodeType = 'static' | 'dynamic' | 'any';

// Space - out of space nodes
// Missing - nodes with missing disks
type INodesApiRequestProblemType = 'missing' | 'space';

export interface INodesApiRequestParams {
    tenant?: string;
    type?: INodesApiRequestNodeType;
    filter?: INodesApiRequestProblemType;
    storage?: boolean;
    tablets?: boolean;
}

export interface INodesHandledResponse {
    Nodes?: INodesPreparedEntity[];
    TotalNodes: number;
}

type INodesApiRequestAction = ApiRequestAction<
    typeof FETCH_NODES,
    INodesHandledResponse,
    IResponseError
>;

export type INodesAction =
    | INodesApiRequestAction
    | (
          | ReturnType<typeof setDataWasNotLoaded>
          | ReturnType<typeof setNodesUptimeFilter>
          | ReturnType<typeof setSearchValue>
          | ReturnType<typeof resetNodesState>
      );

export interface INodesRootStateSlice {
    nodes: INodesState;
}
