import type {EFlag} from './enums';
import type {TPDiskStateInfo} from './pdisk';
import type {TTabletStateInfo} from './tablet';
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
}

export interface TNodeInfo {
    NodeId: number;
    SystemState: TSystemStateInfo;
    PDisks?: TPDiskStateInfo[];
    VDisks?: TVDiskStateInfo[];
    Tablets?: TTabletStateInfo[];
}

export interface TNodesGroup {
    GroupName: string;
    NodeCount: number;
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
}

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
