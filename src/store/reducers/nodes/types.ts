import type {OrderType} from '@gravity-ui/react-data-table';

import type {
    EVersion,
    TTabletStateInfo as TComputeTabletStateInfo,
} from '../../../types/api/compute';
import type {EFlag} from '../../../types/api/enums';
import type {TEndpoint, TPoolStats} from '../../../types/api/nodes';
import type {TTabletStateInfo as TFullTabletStateInfo} from '../../../types/api/tablet';
import type {NodesSortValue, NodesUptimeFilterValues} from '../../../utils/nodes';
import type {ProblemFilterValue} from '../settings/types';
import type {VisibleEntities} from '../storage/types';

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
    LoadAveragePercents?: number[];
    Tablets?: TFullTabletStateInfo[] | TComputeTabletStateInfo[];
    Endpoints?: TEndpoint[];

    TotalSessions?: number;
}

export type NodeType = 'static' | 'dynamic' | 'any';

export interface NodesSortParams {
    sortOrder: OrderType | undefined;
    sortValue: NodesSortValue | undefined;
}

export interface NodesFilters {
    searchValue: string;
    problemFilter: ProblemFilterValue;
    uptimeFilter: NodesUptimeFilterValues;
    path?: string;
    database?: string;
}

export interface NodesGeneralRequestParams extends Partial<NodesSortParams> {
    filter?: string; // NodeId or Host
    uptime?: number; // return nodes with less uptime in seconds
    problems_only?: boolean; // return nodes with SystemState !== EFlag.Green

    offset?: number;
    limit?: number;
}

export interface NodesApiRequestParams extends NodesGeneralRequestParams {
    node_id?: number | string; // get only specific node
    path?: string;
    database?: string;
    /** @deprecated use database instead */
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
