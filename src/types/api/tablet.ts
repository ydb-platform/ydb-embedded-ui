import {EFlag} from './enums';

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

interface TDomainKey {
    /** fixed64 */
    SchemeShard?: string;
    /** fixed64 */
    PathId?: string;
}

enum EType {
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

enum ETabletState {
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
}
