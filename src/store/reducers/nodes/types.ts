import type {OrderType} from '@gravity-ui/react-data-table';

import type {EFlag} from '../../../types/api/enums';
import type {NodesSortValue, TEndpoint, TPoolStats} from '../../../types/api/nodes';
import type {TTabletStateInfo as TFullTabletStateInfo} from '../../../types/api/tablet';
import type {NodesUptimeFilterValues} from '../../../utils/nodes';
import type {ProblemFilterValue} from '../settings/types';

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
    Tablets?: TFullTabletStateInfo[];
    Endpoints?: TEndpoint[];

    TotalSessions?: number;
}

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

export interface NodesGroup {
    name: string;
    count: number;
}

export interface NodesHandledResponse {
    Nodes?: NodesPreparedEntity[];
    NodeGroups?: NodesGroup[];
    TotalNodes: number;
    FoundNodes?: number;
}
