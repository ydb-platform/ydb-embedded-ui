import type {BackendSortParam, SchemaPathParam} from './common';
import type {EFlag} from './enums';
import type {TPDiskStateInfo} from './pdisk';
import type {TTabletStateInfo} from './tablet';
import type {TThreadPoolInfo} from './threads';
import type {TVDiskStateInfo} from './vdisk';

/**
 * endpoint: /viewer/json/nodes
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TNodesInfo {
    Overall?: EFlag;
    Nodes?: TNodeInfo[];
    NodeGroups?: TNodesGroup[];

    /** uint64 */
    TotalNodes: string;
    /** uint64 */
    FoundNodes: string;
    /** uint64 */
    MaximumSlotsPerDisk?: string;
    /** uint64 */
    MaximumDisksPerNode?: string;
}

export interface TNodeInfo {
    NodeId: number;

    Database?: string;

    CpuUsage?: number;
    DiskSpaceUsage?: number;
    UptimeSeconds?: number;
    Disconnected?: boolean;

    SystemState: TSystemStateInfo;
    PDisks?: TPDiskStateInfo[];
    VDisks?: TVDiskStateInfo[];
    Tablets?: TTabletStateInfo[];

    // Network stats
    Connections?: number; // total number of live connections
    ConnectStatus?: EFlag; // Max
    /** uint64 */
    ReceiveThroughput?: string;
    /** uint64 */
    SendThroughput?: string;
    NetworkUtilization?: number; // Sum
    NetworkUtilizationMin?: number;
    NetworkUtilizationMax?: number;
    /** int64 */
    ClockSkewUs?: string; // Avg
    /** int64 */
    ClockSkewMinUs?: string;
    /** int64 */
    ClockSkewMaxUs?: string;
    /** int64 */
    ReverseClockSkewUs?: string; // Avg
    /** uint64 */
    PingTimeUs?: string; // Avg
    /** uint64 */
    PingTimeMinUs?: string;
    /** uint64 */
    PingTimeMaxUs?: string;
    /** uint64 */
    ReversePingTimeUs?: string; // Avg
    Peers?: TNodeStateInfo[];
    ReversePeers?: TNodeStateInfo[];

    // Bridge mode
    PileName?: string;
}

export interface TNodesGroup {
    GroupName: string;
    NodeCount: number;
}

export interface TMemoryStats {
    AnonRss?: string;
    ExternalConsumption?: string;
    AllocatorCachesMemory?: string;
    AllocatedMemory?: string;

    SharedCacheConsumption?: string;
    SharedCacheLimit?: string;

    MemTableConsumption?: string;
    MemTableLimit?: string;

    QueryExecutionConsumption?: string;
    QueryExecutionLimit?: string;

    HardLimit?: string;
    SoftLimit?: string;
}

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/node_whiteboard.proto
 */
export interface TSystemStateInfo {
    /** uint64 */
    StartTime?: string;
    /** uint64 */
    ChangeTime?: string;
    SystemLocation?: TLegacyNodeLocation;
    /** double */
    LoadAverage?: number[];
    NumberOfCpus?: number;
    RealNumberOfCpus?: number;
    SystemState?: EFlag;
    MessageBusState?: EFlag;
    GRpcState?: EFlag;
    NodeId?: number;
    Count?: number;
    DataCenterId?: number;
    DataCenterDescription?: string;
    DataCenter?: string;
    RackId?: number;
    Rack?: string;
    Host?: string;
    Version?: string;
    PoolStats?: TPoolStats[];
    Endpoints?: TEndpoint[];
    Roles?: string[];
    Tenants?: string[];
    ClusterName?: string;
    /** uint64 */
    MemoryUsed?: string;
    /** uint64 */
    MemoryLimit?: string;
    ConfigState?: EConfigState; //default = Consistent
    /** uint64 */
    MemoryUsedInAlloc?: string;
    /** double */
    MaxDiskUsage?: number;
    Location?: TNodeLocation;
    CoresUsed?: number;
    CoresTotal?: number;

    MemoryStats?: TMemoryStats;

    /**
     * int64
     *
     * a positive value means the peer is ahead in time; a negative value means it's behind
     */
    MaxClockSkewWithPeerUs?: string;
    MaxClockSkewPeerId?: number;

    /** uint64 */
    DisconnectTime?: string;

    SharedCacheStats?: TNodeSharedCache;
    TotalSessions?: number;
    NodeName?: string;
    /** Detailed thread information when fields_required=-1 is used */
    Threads?: TThreadPoolInfo[];
}

export interface TNodeStateInfo {
    PeerName?: string;
    Connected?: boolean;
    NodeId?: number;
    /** uint64 */
    ChangeTime?: string;
    /** uint32 */
    OutputQueueSize?: string;
    ConnectStatus?: EFlag;
    /** uint64 */
    ConnectTime?: string;
    PeerNodeId?: number;
    /** int64 */
    ClockSkewUs?: string; // a positive value means the peer is ahead in time; a negative value means it's behind
    /** uint32 */
    PingTimeUs?: string; // RTT for the peer
    Utilization?: number; // network utilization 0-1
    ScopeId?: unknown;
    /** uint32 */
    Count?: string;
    /** uint64 */
    BytesWritten?: string; // bytes written to the socket
    /** uint64 */
    WriteThroughput?: string; // bytes written per second
    SessionState?: ESessionState;
}

type ESessionState = 'CLOSED' | 'PENDING_CONNECTION' | 'CONNECTED';

export type PoolName = 'System' | 'User' | 'Batch' | 'IO' | 'IC';

export interface TPoolStats {
    Name?: PoolName;
    /** double */
    Usage?: number;
    Threads?: number;
}

export interface TEndpoint {
    Name?: string;
    Address?: string;
}

export interface TLegacyNodeLocation {
    DataCenter?: number;
    Room?: number;
    Rack?: number;
    Body?: number;
}

interface TNodeLocation {
    // compatibility section -- will be removed in future versions
    DataCenterNum?: number; // deprecated
    RoomNum?: number; // deprecated
    RackNum?: number; // deprecated
    BodyNum?: number; // deprecated
    Body?: number; // deprecated

    BridgePileName?: string;

    DataCenter?: string;
    Module?: string;
    Rack?: string;
    Unit?: string;
}

interface TNodeSharedCache {
    /** uint64 */
    UsedBytes: string;
    /** uint64 */
    LimitBytes: string;
}

enum EConfigState {
    'Consistent' = 'Consistent',
    'Outdated' = 'Outdated',
}

// ==== Request types ====

type NodesType =
    | 'static'
    | 'dynamic'
    | 'storage' // v6
    | 'any';

// v14
export type NodesPeerRole = 'database' | 'static' | 'other' | 'any';

type NodesWithFilter = 'space' | 'missing' | 'all';

// v6
export type NodesGroupByField =
    | 'NodeId'
    | 'Host'
    | 'NodeName'
    | 'Database'
    | 'DiskSpaceUsage'
    | 'DC'
    | 'Rack'
    | 'Missing'
    | 'Uptime'
    | 'Version'
    | 'SystemState' // v12
    | 'ConnectStatus' // v13
    | 'NetworkUtilization' // v13
    | 'ClockSkew' // v13
    | 'PingTime' // v13
    | 'PileName';

export type NodesRequiredField =
    | 'NodeId'
    | 'SystemState'
    | 'PDisks'
    | 'VDisks'
    | 'Tablets'
    | 'Peers' // v13
    | 'Host'
    | 'NodeName'
    | 'DC'
    | 'Rack'
    | 'Version'
    | 'Uptime'
    | 'Memory'
    | 'MemoryDetailed' // v10
    | 'CPU'
    | 'LoadAverage'
    | 'Missing'
    | 'DiskSpaceUsage'
    | 'SubDomainKey'
    | 'DisconnectTime'
    | 'Database'
    | `Connections` // v13
    | `ConnectStatus` // v13
    | `NetworkUtilization` // v13
    | `ClockSkew` // v13
    | `PingTime` // v13
    | `SendThroughput` // v13
    | `ReceiveThroughput` // v13
    | 'PileName';

export type NodesSortValue =
    | 'NodeId'
    | 'Host'
    | 'NodeName'
    | 'DC'
    | 'Rack'
    | 'Version'
    | 'Uptime'
    | 'CPU'
    | 'LoadAverage'
    | 'Memory'
    | 'MemoryDetailed' // v10
    | `Missing`
    | `DiskSpaceUsage`
    | `Database`
    | 'SystemState' // v12
    | `Connections` // v13
    | `ConnectStatus` // v13
    | `NetworkUtilization` // v13
    | `ClockSkew` // v13
    | `PingTime` // v13
    | `SendThroughput` // v13
    | `ReceiveThroughput` // v13
    | `BytesSend` // v13
    | `BytesReceived`; // v13

export type NodesSort = BackendSortParam<NodesSortValue>;

export interface NodesRequestParams {
    /** @deprecated use database instead */
    tenant?: string;
    database?: string;

    path?: SchemaPathParam;

    node_id?: string | number;
    group_id?: string | number;
    pool?: string;

    type?: NodesType;
    with?: NodesWithFilter;

    storage?: boolean;
    tablets?: boolean;

    /** return nodes with less uptime in seconds */
    uptime?: number;
    /** return nodes with SystemState !== EFlag.Green */
    problems_only?: boolean;
    /** filter nodes by id or host */
    filter?: string;
    filter_peer_role?: NodesPeerRole; // v14

    sort?: NodesSort;

    group?: NodesGroupByField;
    filter_group_by?: NodesGroupByField;
    filter_group?: string;
    fieldsRequired?: NodesRequiredField[] | 'all';

    offset?: number;
    limit?: number;
}
