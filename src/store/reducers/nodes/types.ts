import type {OrderType} from '@gravity-ui/react-data-table';

import type {EFlag} from '../../../types/api/enums';
import type {NodesSortValue, TEndpoint, TPoolStats} from '../../../types/api/nodes';
import type {TTabletStateInfo as TFullTabletStateInfo} from '../../../types/api/tablet';
import type {NodesUptimeFilterValues, PreparedNodeSystemState} from '../../../utils/nodes';
import type {ProblemFilterValue} from '../settings/types';

export interface NodesPreparedEntity extends PreparedNodeSystemState {
    NodeId: number;
    Host?: string;
    NodeName?: string;
    SystemState?: EFlag;
    Version?: string;

    StartTime?: string;
    Uptime: string;
    DisconnectTime?: string;

    MemoryUsed?: string;
    MemoryUsedInAlloc?: string;
    MemoryLimit?: string;

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
