import type {EFlag} from '../../../types/api/enums';
import type {
    NodesGroupByField,
    NodesPeerRole,
    TEndpoint,
    TPoolStats,
} from '../../../types/api/nodes';
import type {TTabletStateInfo as TFullTabletStateInfo} from '../../../types/api/tablet';
import type {NodesUptimeFilterValues, PreparedNodeSystemState} from '../../../utils/nodes';
import type {ProblemFilterValue} from '../settings/types';

export interface NodesPreparedEntity extends PreparedNodeSystemState {
    NodeId: number;
    Host?: string;
    NodeName?: string;
    SystemState?: EFlag;
    Version?: string;
    // Bridge mode
    PileName?: string;

    StartTime?: string;
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

    Connections?: number;
    ConnectStatus?: EFlag;
    ReceiveThroughput?: string;
    SendThroughput?: string;
    NetworkUtilization?: number;
    NetworkUtilizationMin?: number;
    NetworkUtilizationMax?: number;
    ClockSkewUs?: string;
    ClockSkewMinUs?: string;
    ClockSkewMaxUs?: string;
    PingTimeUs?: string;
    PingTimeMinUs?: string;
    PingTimeMaxUs?: string;
}

export interface NodesFilters {
    searchValue: string;
    problemFilter: ProblemFilterValue;
    uptimeFilter: NodesUptimeFilterValues;
    peerRoleFilter?: NodesPeerRole;

    path?: string;
    databaseFullPath?: string;
    database?: string;

    filterGroup?: string;
    filterGroupBy?: NodesGroupByField;
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
