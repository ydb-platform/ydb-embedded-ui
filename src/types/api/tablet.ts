import type {EFlag} from './enums';

/**
 * endpoint: /viewer/json/tabletinfo
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/sys_view.proto
 */
export interface TEvTabletStateResponse {
    TabletStateInfo?: TTabletStateInfo[];

    /** uint64 */
    ResponseTime?: string;
    /** uint64 */
    ResponseDuration?: string;
    /** uint64 */
    ProcessDuration?: string;

    Packed5?: unknown;
}

/**
 * endpoint: /viewer/json/tabletinfo with merge=false in query.
 * Maps nodes to their tablets
 */
export type UnmergedTEvTabletStateResponse = Record<string, TEvTabletStateResponse>;

export interface TTabletStateInfo {
    /** uint64 */
    TabletId?: string;
    /** uint64 */
    CreateTime?: string;
    /** uint64 */
    ChangeTime?: string;

    State?: ETabletState;
    UserState?: number;
    Generation?: number;
    Type?: EType;
    Host?: string;
    ChannelGroupIDs?: number[]; // BS Group per channel
    Attributes?: TCustomTabletAttribute[];
    NodeId?: number;
    Leader?: boolean; // leader or follower
    Count?: number;
    FollowerId?: number;
    Overall?: EFlag;
    TenantId?: TDomainKey;
    /** fixed64 */
    HiveId?: string;
}

interface TCustomTabletAttribute {
    Key?: number;
    Value?: string;
}

export interface TDomainKey {
    /** fixed64 */
    SchemeShard?: string;
    /** fixed64 */
    PathId?: string;
}

export enum EType {
    'Unknown' = 'Unknown',
    'OldSchemeShard' = 'OldSchemeShard',
    'OldDataShard' = 'OldDataShard',
    'OldHive' = 'OldHive',
    'OldCoordinator' = 'OldCoordinator',
    'Mediator' = 'Mediator',
    'OldTxProxy' = 'OldTxProxy',
    'OldBSController' = 'OldBSController',
    'Dummy' = 'Dummy',
    'RTMRPartition' = 'RTMRPartition',
    'OldKeyValue' = 'OldKeyValue',
    'KeyValue' = 'KeyValue',
    'Coordinator' = 'Coordinator',
    'Hive' = 'Hive',
    'BSController' = 'BSController',
    'SchemeShard' = 'SchemeShard',
    'TxProxy' = 'TxProxy',
    'DataShard' = 'DataShard',
    'PersQueue' = 'PersQueue',
    'Cms' = 'Cms',
    'NodeBroker' = 'NodeBroker',
    'TxAllocator' = 'TxAllocator',
    'PersQueueReadBalancer' = 'PersQueueReadBalancer',
    'BlockStoreVolume' = 'BlockStoreVolume',
    'BlockStorePartition' = 'BlockStorePartition',
    'TenantSlotBroker' = 'TenantSlotBroker',
    'Console' = 'Console',
    'Kesus' = 'Kesus',
    'BlockStorePartition2' = 'BlockStorePartition2',
    'BlockStoreDiskRegistry' = 'BlockStoreDiskRegistry',
    'SysViewProcessor' = 'SysViewProcessor',
    'FileStore' = 'FileStore',
    'ColumnShard' = 'ColumnShard',
    'TestShard' = 'TestShard',
    'SequenceShard' = 'SequenceShard',
    'ReplicationController' = 'ReplicationController',
    'BlobDepot' = 'BlobDepot',
    'UserTypeStart' = 'UserTypeStart',
    'TypeInvalid' = 'TypeInvalid',
}

export enum ETabletState {
    'Created' = 'Created',
    'ResolveStateStorage' = 'ResolveStateStorage',
    'Candidate' = 'Candidate',
    'BlockBlobStorage' = 'BlockBlobStorage',
    'RebuildGraph' = 'RebuildGraph',
    'WriteZeroEntry' = 'WriteZeroEntry',
    'Restored' = 'Restored',
    'Discover' = 'Discover',
    'Lock' = 'Lock',
    'Dead' = 'Dead',
    'Active' = 'Active',
    'ResolveLeader' = 'ResolveLeader',
    'Deleted' = 'Deleted',
    'Stopped' = 'Stopped',
    'Terminating' = 'Terminating',
}

interface TBoundChannel {
    IOPS?: number;
    StoragePoolName?: string;
    Throughput?: number;
    Size?: number;
}

export interface TTabletStorageInfoChannelHistory {
    GroupID?: number;
    FromGeneration?: number;
    Timestamp?: string;
}

interface TTabletStorageInfoChannel {
    Channel?: number;
    History?: TTabletStorageInfoChannelHistory[];
}

//tablet data from hive
export interface TTabletHiveResponse {
    BoundChannels?: TBoundChannel[];
    TabletStorageInfo?: {Channels?: TTabletStorageInfoChannel[]; Version?: number};
}
