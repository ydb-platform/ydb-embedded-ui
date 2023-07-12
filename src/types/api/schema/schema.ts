import type {TMetrics} from '../tenant';
import type {TExternalDataSourceDescription} from './externalDataSource';
import type {TExternalTableDescription} from './externalTable';

export interface TEvDescribeSchemeResult {
    Status?: EStatus;
    Reason?: string;
    Path?: string;
    PathDescription?: TPathDescription;
    /** fixed64 */
    PathOwner?: string;
    /** fixed64 */
    PathId?: string;

    LastExistedPrefixPath?: string;
    /** fixed64 */
    LastExistedPrefixPathId?: string;
    LastExistedPrefixDescription?: TPathDescription;
    /** fixed64 */
    PathOwnerId?: string;
}

enum EStatus {
    StatusSuccess = 'StatusSuccess',
    StatusAccepted = 'StatusAccepted',
    StatusPathDoesNotExist = 'StatusPathDoesNotExist',
    StatusPathIsNotDirectory = 'StatusPathIsNotDirectory',
    StatusAlreadyExists = 'StatusAlreadyExists',
    StatusSchemeError = 'StatusSchemeError',
    StatusNameConflict = 'StatusNameConflict',
    StatusInvalidParameter = 'StatusInvalidParameter',
    StatusMultipleModifications = 'StatusMultipleModifications',
    StatusReadOnly = 'StatusReadOnly',
    StatusTxIdNotExists = 'StatusTxIdNotExists',
    StatusTxIsNotCancellable = 'StatusTxIsNotCancellable',
    StatusAccessDenied = 'StatusAccessDenied',
    StatusNotAvailable = 'StatusNotAvailable',
    StatusPreconditionFailed = 'StatusPreconditionFailed',
    StatusRedirectDomain = 'StatusRedirectDomain',
    StatusQuotaExceeded = 'StatusQuotaExceeded',
    StatusResourceExhausted = 'StatusResourceExhausted',
}

// source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/flat_scheme_op.proto
// incomplete interface, only currently used fields are covered
export interface TPathDescription {
    /** info about the path itself */
    Self?: TDirEntry;
    DomainDescription?: TDomainDescription;

    // for directory
    Children?: TDirEntry[];

    // for table
    Table?: TTableDescription;
    TableStats?: TTableStats;
    TabletMetrics?: TMetrics;
    TablePartitions?: TTablePartition[];
    TablePartitionStats?: TTableStats[];
    TablePartitionMetrics?: TMetrics[];

    ColumnStoreDescription?: TColumnStoreDescription;
    ColumnTableDescription?: TColumnTableDescription;

    TableIndex?: TIndexDescription;

    CdcStreamDescription?: TCdcStreamDescription;
    PersQueueGroup?: TPersQueueGroupDescription;

    ExternalTableDescription?: TExternalTableDescription;
    ExternalDataSourceDescription?: TExternalDataSourceDescription;
}

export interface TDirEntry {
    Name?: string;
    /** uint64 */
    PathId?: string;
    /** uint64 */
    SchemeshardId?: string;
    PathType?: EPathType;
    CreateFinished?: boolean;
    /** uint64 */
    CreateTxId?: string;
    /** uint64 */
    CreateStep?: string;
    /** uint64 */
    ParentPathId?: string;
    PathState?: EPathState;
    Owner?: string;
    ACL?: string;
    EffectiveACL?: string;
    /** uint64 */
    PathVersion?: string;
    PathSubType?: EPathSubType;
    Version?: TPathVersion;
}

interface TDomainDescription {
    ProcessingParams?: TProcessingParams;

    DomainKey?: TDomainKey;

    StoragePools?: TStoragePool[];

    /** uint64 */
    PathsInside?: string;
    /** uint64 */
    PathsLimit?: string;
    /** uint64 */
    ShardsInside?: string;
    /** uint64 */
    ShardsLimit?: string;

    ResourcesDomainKey?: TDomainKey;

    DiskSpaceUsage?: TDiskSpaceUsage;

    /** uint64 */
    PQPartitionsInside?: string;
    /** uint64 */
    PQPartitionsLimit?: string;

    DomainState?: TDomainState;

    DeclaredSchemeQuotas?: TSchemeQuotas;
    DatabaseQuotas?: DatabaseQuotas;
    SecurityState?: TSecurityState;
}

interface TDomainKey {
    /** fixed64 */
    SchemeShard?: string;
    /** fixed64 */
    PathId?: string;
}

interface TProcessingParams {
    Version?: number;
    /** uint64 */
    PlanResolution?: string;
    /** fixed64 */
    Coordinators?: string[];
    /** uint64 */
    TimeCastBucketsPerMediator?: string;
    /** fixed64 */
    Mediators?: string[];
    /** fixed64 */
    SchemeShard?: string;
    /** fixed64 */
    Hive?: string;
    /** fixed64 */
    SysViewProcessor?: string;
}

interface TDomainState {
    DiskQuotaExceeded?: boolean;
}

interface TDiskSpaceUsage {
    Tables?: TTables;
}

interface TTables {
    /** uint64 */
    TotalSize?: string;
    /** uint64 */
    DataSize?: string;
    /** uint64 */
    IndexSize?: string;
}

interface TStoragePool {
    Name?: string;
    Kind?: string;
}

interface TSchemeQuotas {
    SchemeQuotas?: TSchemeQuota[];
}

interface TSchemeQuota {
    /** double */
    BucketSize?: number;
    /** uint64 */
    BucketSeconds?: string;
}

interface TSecurityState {
    PublicKeys?: TPublicKey[];
    Sids?: TSid[];
    Audience: string;
}

interface TPublicKey {
    /** uint64 */
    KeyId: string;
    KeyDataPEM: string;
    /** uint64 */
    ExpiresAt: string;
}

interface TSid {
    Name: string;
    Type: SidType;

    Hash: string;
    Members?: string[];
}

enum SidType {
    'UNKNOWN' = 'UNKNOWN',
    'USER' = 'USER',
    'GROUP' = 'GROUP',
}

interface DatabaseQuotas {
    /** uint64 */
    // eslint-disable-next-line camelcase
    data_size_hard_quota: string;

    /** uint64 */
    // eslint-disable-next-line camelcase
    data_size_soft_quota: string;

    /** uint64 */
    // eslint-disable-next-line camelcase
    data_stream_shards_quota: string;

    /** uint64 */
    // eslint-disable-next-line camelcase
    data_stream_reserved_storage_quota: string;

    // eslint-disable-next-line camelcase
    ttl_min_run_internal_seconds: number;
}

export interface TTableDescription {
    Name?: string;
    /**
     * @deprecated LocalPathId
     *
     * uint64
     */
    Id_Deprecated?: string;
    Columns?: TColumnDescription[];
    KeyColumnNames?: string[];
    KeyColumnIds?: number[];
    /**
     * Describes uniform partitioning on first key column int on ranges.
     * The first key column must be of integer type
     */
    UniformPartitionsCount?: number;

    PartitionConfig?: TPartitionConfig;
    DropColumns?: TColumnDescription[];
    Path?: string;

    /** bytes */
    PartitionRangeBegin?: unknown;
    /** bytes */
    PartitionRangeEnd?: unknown;
    PartitionRangeBeginIsInclusive?: boolean;
    PartitionRangeEndIsInclusive?: boolean;

    CopyFromTable?: string;
    /** Boundaries for non-uniform split */
    SplitBoundary?: TSplitBoundary[];

    TableIndexes?: TIndexDescription[];
    /** uint64 */
    TableSchemaVersion?: string;

    PathId?: TPathID;

    TTLSettings?: TTTLSettings;

    /**
     * used with CopyFromTable
     *
     * default false
     */
    OmitFollowers?: boolean;
    /** default false */
    IsBackup?: boolean;

    CdcStreams?: TCdcStreamDescription[];
    Sequences?: TSequenceDescription[];
}

export interface TColumnDescription {
    Name?: string;
    Type?: string;
    TypeId?: number;
    TypeInfo?: TTypeInfo;
    Id?: number;
    Family?: number;
    FamilyName?: string;
    /** Path to sequence for default values */
    DefaultFromSequence?: string;
    NotNull?: boolean;
}

interface TSplitBoundary {
    /** A tuple representing full key or key prefix */
    KeyPrefix?: unknown;
    /**
     * Or same as KeyPrefix but already serialized
     *
     * bytes
     */
    SerializedKeyPrefix?: unknown;
}

export interface TTTLSettings {
    Enabled?: TEnabled;
    Disabled?: {};
    UseTiering?: string;
}

interface TEnabled {
    ColumnName?: string;
    ExpireAfterSeconds?: number;
    ColumnUnit?: EUnit;
    SysSettings?: TSysSettings;
}

interface TSysSettings {
    /**
     * default 3600000000 (1 hour)
     *
     * uint64
     */
    RunInterval?: string;
    /**
     * default 300000000 (5 minutes)
     *
     * uint64
     */
    RetryInterval?: string;
    /** default 512000 */
    BatchMaxBytes?: number;
    /** default 1 */
    BatchMinKeys?: number;
    /** default 256 */
    BatchMaxKeys?: number;
    /**
     * zero means no limit
     *
     * default 0
     */
    MaxShardsInFlight?: number;
}

interface TSequenceDescription {
    Name?: string;
    /** sequence path id, assigned by schemeshard */
    PathId?: TPathID;
    /**
     * incremented every time sequence is altered
     *
     * uint64
     */
    Version?: string;
    /**
     * current sequenceshard, assigned by schemeshard
     *
     * uint64
     */
    SequenceShard?: string;
    /**
     * minimum value, defaults to 1 or Min<i64>
     *
     * sint64
     */
    MinValue?: string;
    /**
     * maximum value, defaults to Max<i64> or -1
     *
     * sint64
     */
    MaxValue?: string;
    /**
     * start value, defaults to MinValue
     *
     * sint64
     */
    StartValue?: string;
    /**
     * number of items to cache, defaults to 1
     *
     * uint64
     */
    Cache?: string;
    /**
     * increment at each call, defaults to 1
     *
     * sint64
     */
    Increment?: string;
    /** true when cycle on overflow is allowed */
    Cycle?: boolean;
}

export interface TPartitionConfig {
    /** One of the predefined policies*/
    NamedCompactionPolicy?: string;
    /** Customized policy */
    CompactionPolicy?: TCompactionPolicy;
    /** uint64 */
    FollowerCount?: string;
    /**
     * Cache size for the whole tablet including all user and system tables
     *
     * uint64
     */
    ExecutorCacheSize?: string;
    /**
     * if true followers can upgrade to leader, if false followers only handle reads
     *
     * default true
     */
    AllowFollowerPromotion?: boolean;
    /**
     * Maximum size in bytes that is allowed to be read by a single Tx
     *
     * uint64
     */
    TxReadSizeLimit?: string;
    /** @deprecated use FollowerGroups */
    CrossDataCenterFollowerCount?: number;
    /** for configuring erasure and disk categories */
    ChannelProfileId?: number;
    PartitioningPolicy?: TPartitioningPolicy;
    PipelineConfig?: TPipelineConfig;
    ColumnFamilies?: TFamilyDescription[];
    ResourceProfile?: string;
    DisableStatisticsCalculation?: boolean;
    /**
     * Build and use per-part bloom filter for fast key non-existence check
     *
     * default false
     */
    EnableFilterByKey?: boolean;
    /**
     * Commit log faster at the expense of bandwidth for cross-DC
     *
     * default true
     */
    ExecutorFastLogPolicy?: boolean;
    StorageRooms?: TStorageRoom[];
    /**
     * Use erase cache for faster iteration over erased rows
     *
     * default true
     */
    EnableEraseCache?: boolean;
    /**
     * Minimum number of erased rows worth caching
     *
     * default 16
     */
    EraseCacheMinRows?: number;
    /**
     * Maximum number of bytes to use for cached rows
     *
     * default 1MB
     */
    EraseCacheMaxBytes?: number;
    FreezeState?: EFreezeState;
    ShadowData?: boolean;
    /** 0 or 1 items */
    FollowerGroups?: TFollowerGroup[];
    /** uint64 milliseconds */
    KeepSnapshotTimeout?: string;
}

enum EPurpose {
    SysLog,
    Log,
    Data,
    External,
}

interface TChannelPurpose {
    Purpose?: EPurpose;
    Channel?: number;
}

interface TStorageRoom {
    RoomId?: number;
    Explanation?: TChannelPurpose[];
}

interface TPipelineConfig {
    /** default 8 */
    NumActiveTx?: number;
    DataTxCacheSize?: number;
    /** default true */
    EnableOutOfOrder?: boolean;
    DisableImmediate?: boolean;
    EnableSoftUpdates?: boolean;
}
interface TFamilyDescription {
    Id?: number;
    Room?: number;
    /** @deprecated use ColumnCodec */
    Codec?: number;
    /** @deprecated use ColumnCache */
    InMemory?: boolean;
    Name?: string;
    ColumnCodec?: EColumnCodec;
    ColumnCache?: EColumnCache;
    /** @deprecated use StorageConfig */
    Storage?: EColumnStorage;
    StorageConfig?: TStorageConfig;
}

interface TStorageConfig {
    SysLog?: TStorageSettings;
    Log?: TStorageSettings;
    Data?: TStorageSettings;
    External?: TStorageSettings;
    DataThreshold?: number;
    ExternalThreshold?: number;
}

enum EColumnCache {
    ColumnCacheNone,
    ColumnCacheOnce,
    ColumnCacheEver,
}

enum EColumnStorage {
    ColumnStorage1,
    ColumnStorage2,
    ColumnStorage1Ext1,
    ColumnStorage1Ext2,
    ColumnStorage2Ext1,
    ColumnStorage2Ext2,
    ColumnStorage1Med2Ext2,
    ColumnStorage2Med2Ext2,
    ColumnStorageTest_1_2_1k,
}

enum EFreezeState {
    Unspecified,
    Freeze,
    Unfreeze,
}

interface TPartitioningPolicy {
    /**
     * Partition gets split when this threshold is exceeded
     *
     * uint64
     */
    SizeToSplit?: string;

    MinPartitionsCount?: number;
    MaxPartitionsCount?: number;

    FastSplitSettings?: TFastSplitSettings;
    SplitByLoadSettings?: TSplitByLoadSettings;
}

interface TFastSplitSettings {
    /** uint64 */
    SizeThreshold?: string;
    /** uint64 */
    RowCountThreshold?: string;
    CpuPercentageThreshold?: number;
}

interface TSplitByLoadSettings {
    Enabled?: boolean;
    CpuPercentageThreshold?: number;
}

interface TCompactionPolicy {
    /** uint64 */
    InMemSizeToSnapshot?: string;
    /** snapshot inmem state when size AND steps from last snapshot passed */
    InMemStepsToSnapshot?: number;
    InMemForceStepsToSnapshot?: number;
    /** uint64 */
    InMemForceSizeToSnapshot?: string;
    /** @deprecated default 0 */
    InMemCompactionBrokerQueue?: number;
    /** uint64 default 67108864 */
    ReadAheadHiThreshold?: string;
    /** uint64 default 16777216 */
    ReadAheadLoThreshold?: string;
    /** default 7168 */
    MinDataPageSize?: number;
    /** @deprecated default 0*/
    SnapBrokerQueue?: number;
    /** @deprecated default 1*/
    BackupBrokerQueue?: number;
    /** default 5 */
    DefaultTaskPriority?: number;
    BackgroundSnapshotPolicy?: TBackgroundPolicy;
    InMemResourceBrokerTask?: string;
    SnapshotResourceBrokerTask?: string;
    BackupResourceBrokerTask?: string;
    /** uint64 */
    LogOverheadSizeToSnapshot?: string;
    LogOverheadCountToSnapshot?: number;
    DroppedRowsPercentToCompact?: number;
    /** default CompactionStrategyUnset */
    CompactionStrategy?: ECompactionStrategy;
    ShardPolicy?: TShardPolicy;
    KeepEraseMarkers?: boolean;
    Generation?: TGenerationPolicy[];
}

enum ECompactionStrategy {
    CompactionStrategyUnset,
    CompactionStrategyGenerational,
    CompactionStrategySharded,
}

interface TShardPolicy {
    /**
     * Adjacent shards smaller than this will be merged
     *
     * default 33554432
     *
     * uint64
     */
    MinShardSize?: string;
    /**
     * Shards bigger than this will split in two or more pieces
     *
     * default 134217728
     *
     * uint64
     */
    MaxShardSize?: string;
    /**
     * Slices smaller than this will get prioritized compaction
     *
     * default 2097152
     *
     * uint64
     */
    MinSliceSize?: string;
    /**
     * Level will be compacted when there are more than this number of slices
     *
     * default 256
     */
    MaxSlicesPerLevel?: number;
    /**
     * Shard will be compacted when there are more than this number of levels
     *
     * default 16
     */
    MaxTotalLevels?: number;
    /**
     * Shard will avoid compacting less than this number of levels
     *
     * default 2
     */
    MinLevelsToCompact?: number;
    /**
     * Level will be compacted when it has X% of its data in upper levels
     *
     * default 100
     */
    NewDataPercentToCompact?: number;
    /**
     * Level will be compacted when it has X% of its rows in upper levels
     *
     * default 0
     */
    NewRowsPercentToCompact?: number;
    /**
     * Resource broker task type for compactions
     *
     * default 'compaction_gen1'
     */
    ResourceBrokerTask?: string;
    /**
     * Base priority for compaction tasks
     *
     * default 1000
     */
    TaskPriorityBase?: number;
    /**
     * Task priority will be increased for every N levels over the minimum
     *
     * default 1
     */
    TaskPriorityLevelsBoost?: number;
    /**
     * Task priority will be decreased for every N bytes of input
     *
     * default 4194304
     *
     * uint64
     */
    TaskPrioritySizePenalty?: string;
    /**
     * Part data may be reused, unless it would leave this much garbage
     *
     * default 20
     */
    MaxGarbagePercentToReuse?: number;
    /**
     * Minimum slice that that may be reused
     *
     * default 524288
     *
     * uint64
     */
    MinSliceSizeToReuse?: string;
}

interface TGenerationPolicy {
    GenerationId?: number;
    /** uint64 */
    SizeToCompact?: string;
    CountToCompact?: number;
    ForceCountToCompact?: number;
    /** uint64 */
    ForceSizeToCompact?: string;
    /** @deprecated */
    CompactionBrokerQueue?: number;
    KeepInCache?: boolean;
    BackgroundCompactionPolicy?: TBackgroundPolicy;
    ResourceBrokerTask?: string;
    ExtraCompactionPercent?: number;
    /** uint64 */
    ExtraCompactionMinSize?: string;
    ExtraCompactionExpPercent?: number;
    /** uint64 */
    ExtraCompactionExpMaxSize?: string;
    /** uint64 */
    UpliftPartSize?: string;
}

interface TBackgroundPolicy {
    /**
     * How much (in %) of forced compaction criteria should be met to submit background task.
     *
     * default 101 - no background compaction by default
     */
    Threshold?: number;
    /**
     * Base background compaction priority value (less priority means more important task).
     * Value is used to compute real task priority basing on compaction criteria, time in queue etc.
     *
     * default 100
     */
    PriorityBase?: number;

    /**
     * Submitted background task may become more prioritized over time.
     * New priority is computed as priority /= max(log(elapsed_seconds) * factor, 1);
     *
     * default 1.0
     *
     * double
     */
    TimeFactor?: number;

    /** @deprecated default 5*/
    TaskType?: number;
    ResourceBrokerTask?: string;
}

export interface TFollowerGroup {
    FollowerCount?: number;
    AllowLeaderPromotion?: boolean;
    AllowClientRead?: boolean;
    AllowedNodeIDs?: number[];
    /** @deprecated use AllowedDataCenters */
    AllowedDataCenterNumIDs?: number[];
    RequireAllDataCenters?: boolean;
    LocalNodeOnly?: boolean;
    RequireDifferentNodes?: boolean;
    FollowerCountPerDataCenter?: boolean; // multiplies FollowerCount by number of DataCenters
    AllowedDataCenters?: string[];
}

export interface TTableStats {
    /** uint64 */
    DataSize?: string;
    /** uint64 */
    RowCount?: string;
    /** uint64 */
    IndexSize?: string;
    /** uint64 */
    InMemSize?: string;

    /**
     * uint64
     * unix time in millisec
     */
    LastAccessTime?: string;
    /**
     * uint64
     * unix time in millisec
     */
    LastUpdateTime?: string;

    RowCountHistogram?: THistogram;
    DataSizeHistogram?: THistogram;

    /** uint64 */
    ImmediateTxCompleted?: string;
    /** uint64 */
    PlannedTxCompleted?: string;
    /** uint64 */
    TxRejectedByOverload?: string;
    /** uint64 */
    TxRejectedBySpace?: string;
    /** uint64 */
    TxCompleteLagMsec?: string;
    /** uint64 */
    InFlightTxCount?: string;

    /** uint64 */
    RowUpdates?: string;
    /** uint64 */
    RowDeletes?: string;
    /** uint64 */
    RowReads?: string;
    /** uint64 */
    RangeReads?: string;
    /** uint64 */
    RangeReadRows?: string;

    /** uint64 */
    PartCount?: string;

    KeyAccessSample?: THistogram;

    /** uint64 */
    SearchHeight?: string;

    /**
     * uint64
     * seconds since epoch
     */
    LastFullCompactionTs?: string;

    // i.e. this shard lent to other shards
    HasLoanedParts?: boolean;
}

interface THistogram {
    Buckets?: THistogramBucket[];
}

interface THistogramBucket {
    Key?: string;
    /** uint64 */
    Value?: string;
}

export interface TIndexDescription {
    Name?: string;
    /** uint64 */
    LocalPathId?: string;

    Type?: EIndexType;
    State?: EIndexState;

    KeyColumnNames?: string[];

    /** uint64 */
    SchemaVersion?: string;

    /** uint64 */
    PathOwnerId?: string;

    DataColumnNames?: string[];
    /** uint64 */
    DataSize?: string;
}

enum ECdcStreamMode {
    ECdcStreamModeInvalid = 'ECdcStreamModeInvalid',
    ECdcStreamModeKeysOnly = 'ECdcStreamModeKeysOnly',
    ECdcStreamModeUpdate = 'ECdcStreamModeUpdate',
    ECdcStreamModeNewImage = 'ECdcStreamModeNewImage',
    ECdcStreamModeOldImage = 'ECdcStreamModeOldImage',
    ECdcStreamModeNewAndOldImages = 'ECdcStreamModeNewAndOldImages',
}

enum ECdcStreamFormat {
    ECdcStreamFormatInvalid = 'ECdcStreamFormatInvalid',
    ECdcStreamFormatProto = 'ECdcStreamFormatProto',
    ECdcStreamFormatJson = 'ECdcStreamFormatJson',
}

enum ECdcStreamState {
    ECdcStreamStateInvalid = 'ECdcStreamStateInvalid',
    ECdcStreamStateReady = 'ECdcStreamStateReady',
    ECdcStreamStateDisabled = 'ECdcStreamStateDisabled',
}

export interface TPathID {
    /** fixed64 */
    OwnerId?: string;
    /** uint64 */
    LocalId?: string;
}

export interface TCdcStreamDescription {
    Name?: string;
    Mode?: ECdcStreamMode;
    Format?: ECdcStreamFormat;
    PathId?: TPathID;
    State?: ECdcStreamState;
    /** uint64 */
    SchemaVersion?: string;
}

// incomplete
export enum EPathType {
    EPathTypeInvalid = 'EPathTypeInvalid',
    EPathTypeDir = 'EPathTypeDir',
    EPathTypeTable = 'EPathTypeTable',
    EPathTypePersQueueGroup = 'EPathTypePersQueueGroup',
    EPathTypeSubDomain = 'EPathTypeSubDomain',

    EPathTypeTableIndex = 'EPathTypeTableIndex',
    EPathTypeExtSubDomain = 'EPathTypeExtSubDomain',

    EPathTypeColumnStore = 'EPathTypeColumnStore',
    EPathTypeColumnTable = 'EPathTypeColumnTable',
    EPathTypeCdcStream = 'EPathTypeCdcStream',
}

export enum EPathSubType {
    EPathSubTypeEmpty = 'EPathSubTypeEmpty',
    EPathSubTypeSyncIndexImplTable = 'EPathSubTypeSyncIndexImplTable',
    EPathSubTypeAsyncIndexImplTable = 'EPathSubTypeAsyncIndexImplTable',
    EPathSubTypeStreamImpl = 'EPathSubTypeStreamImpl',
}

enum EPathState {
    EPathStateNotExist = 'EPathStateNotExist',
    EPathStateNoChanges = 'EPathStateNoChanges',
    EPathStateCreate = 'EPathStateCreate',
    EPathStateAlter = 'EPathStateAlter',
    EPathStateDrop = 'EPathStateDrop',
    EPathStateCopying = 'EPathStateCopying',
    EPathStateBackup = 'EPathStateBackup',
    EPathStateUpgrade = 'EPathStateUpgrade',
    EPathStateMigrated = 'EPathStateMigrated',
    EPathStateRestore = 'EPathStateRestore',
    EPathStateMoving = 'EPathStateMoving',
}

enum EIndexType {
    EIndexTypeInvalid = 'EIndexTypeInvalid',
    EIndexTypeGlobal = 'EIndexTypeGlobal',
    EIndexTypeGlobalAsync = 'EIndexTypeGlobalAsync',
}

enum EIndexState {
    EIndexStateInvalid = 'EIndexStateInvalid',
    EIndexStateReady = 'EIndexStateReady',
    EIndexStateNotReady = 'EIndexStateNotReady',
    EIndexStateWriteOnly = 'EIndexStateWriteOnly',
}

// incomplete
interface TPathVersion {
    /** uint64 */
    GeneralVersion?: string;
}

interface TPartitionKeyRange {
    // Inclusive left border. Emptiness means -inf.
    FromBound?: string;
    // Exclusive right border. Emptiness means +inf.
    ToBound?: string;
}

interface TPartition {
    PartitionId?: number;
    /** uint64 */
    TabletId?: string;
    KeyRange?: TPartitionKeyRange;
}

interface TPartitionToAdd {
    PartitionId?: number;
    GroupId?: number;
}

interface TCodecs {
    /** int64 */
    Ids?: string[];
    Codecs?: string[];
}

interface TKeyComponentSchema {
    Name?: string;
    TypeId?: number;
}

export enum EMeteringMode {
    METERING_MODE_RESERVED_CAPACITY = 'METERING_MODE_RESERVED_CAPACITY',
    METERING_MODE_REQUEST_UNITS = 'METERING_MODE_REQUEST_UNITS',
}

interface TReadQuota {
    ClientId?: string;
    /** uint64 */
    SpeedInBytesPerSecond?: string;
    /** uint64 */
    BurstSize?: string;
}

interface TChannelProfile {
    PoolKind?: string;
    /** uint64 */
    Size?: string;
    ReadIops?: number;
    ReadBandwidth?: number;
    WriteIops?: number;
    WriteBandwidth?: number;
}

interface IamCredentials {
    Endpoint?: string;
    ServiceAccountKey?: string;
}

interface TCredentials {
    OauthToken?: string;
    JwtParams?: string;
    Iam?: IamCredentials;
}

interface TMirrorPartitionConfig {
    Endpoint?: string;
    EndpointPort?: number;
    Topic?: string;
    Consumer?: string;
    /** uint64 */
    ReadFromTimestampsMs?: string;
    Credentials?: TCredentials;
    Database?: string;
    UseSecureConnection?: boolean;
    SyncWriteTime?: boolean;
}

export interface TPQPartitionConfig {
    MaxCountInPartition?: number;
    /** int64 */
    MaxSizeInPartition?: string;
    LifetimeSeconds: number;
    /** uint64 */
    StorageLimitBytes?: string;

    ImportantClientId?: string[];
    LowWatermark?: number;
    SourceIdLifetimeSeconds?: number;
    SourceIdMaxCounts?: number;

    /** uint64 */
    WriteSpeedInBytesPerSecond?: string;
    /** uint64 */
    BurstSize?: string;

    ReadQuota?: TReadQuota[];
    /** uint64 */
    MaxWriteInflightSize?: string;
    /** uint64 */
    BorderWriteInflightSize?: string;

    NumChannels?: number;

    TotalPartitions?: number;

    ExplicitChannelProfiles?: TChannelProfile[];

    MirrorFrom?: TMirrorPartitionConfig;
}

export interface TPQTabletConfig {
    /** uint64 */
    CacheSize?: string;
    PartitionConfig: TPQPartitionConfig;
    /** @deprecated use Partitions */
    PartitionIds?: number[];
    TopicName?: string;
    Version?: number;
    LocalDC?: boolean;
    RequireAuthWrite?: boolean;
    RequireAuthRead?: boolean;
    Producer?: string;
    Ident?: string;
    Topic?: string;
    DC?: string;

    ReadRules?: string[];
    /** uint64[] */
    ReadFromTimestampsMs?: number[];
    /** uint64[] */
    ConsumerFormatVersions?: number[];

    ConsumerCodecs?: TCodecs[];
    ReadRuleServiceTypes?: string;

    /** uint64 */
    FormatVersion?: string;
    Codecs?: TCodecs;

    /** uint64[] */
    ReadRuleVersions?: string[];
    /** uint64[] */
    ReadRuleGenerations?: string[];

    TopicPath?: string;

    YcCloudId?: string;
    YcFolderId?: string;
    YdbDatabaseId?: string;
    YdbDatabasePath?: string;
    FederationAccount?: string;

    PartitionKeySchema?: TKeyComponentSchema[];

    Partitions?: TPartition[];

    MeteringMode?: EMeteringMode;
}

interface TMessageGroup {
    // Id of message group (SourceId)
    Id?: string;
    // Range of the key to which it is allowed to write.
    KeyRange?: TPartitionKeyRange;
}

interface TBootstrapConfig {
    ExplicitMessageGroups?: TMessageGroup[];
}

export interface TPersQueueGroupDescription {
    Name: string;
    /** uint64 */
    PathId?: string;
    TotalGroupCount: number;

    PartitionsToAdd?: TPartitionToAdd[];
    PartitionsToDelete?: number[];
    NextPartitionId?: number;
    PartitionPerTablet?: number;
    PQTabletConfig: TPQTabletConfig;
    Partitions?: TPartition[];
    /** uint64 */
    AlterVersion?: string;
    /** uint64 */
    BalancerTabletID?: string;

    PartitionBoundaries?: unknown;

    BootstrapConfig?: TBootstrapConfig;
}

export interface TColumnTableDescription {
    Name?: string;

    Schema?: TColumnTableSchema;
    TtlSettings?: TColumnDataLifeCycle;

    SchemaPresetId?: number;
    SchemaPresetName?: string;

    ColumnStorePathId?: TPathID;

    ColumnShardCount?: number;
    Sharding?: TColumnTableSharding;

    /** uint64 */
    SchemaPresetVersionAdj?: string;
    /** uint64 */
    TtlSettingsPresetVersionAdj?: string;

    StorageConfig?: TColumnStorageConfig;
}

interface TColumnTableSchema {
    Columns?: TOlapColumnDescription[];
    KeyColumnNames?: string[];
    Engine?: EColumnTableEngine;
    NextColumnId?: number;

    /** uint64 */
    Version?: string;

    DefaultCompression?: TCompressionOptions;
    EnableTiering?: boolean;
}

interface TOlapColumnDescription {
    Id?: number;
    Name?: string;
    Type?: string;
    TypeId?: number;
    TypeInfo?: TTypeInfo;
}

interface TTypeInfo {
    PgTypeId?: number;
}

enum EColumnTableEngine {
    COLUMN_ENGINE_NONE = 'COLUMN_ENGINE_NONE',
    COLUMN_ENGINE_REPLACING_TIMESERIES = 'COLUMN_ENGINE_REPLACING_TIMESERIES',
}

interface TCompressionOptions {
    CompressionCodec?: EColumnCodec;
    CompressionLevel?: number;
}

enum EColumnCodec {
    ColumnCodecPlain = 'ColumnCodecPlain',
    ColumnCodecLZ4 = 'ColumnCodecLZ4',
    ColumnCodecZSTD = 'ColumnCodecZSTD',
}

export interface TColumnDataLifeCycle {
    Enabled?: TTtl;
    Disabled?: {};
    Tiering?: TStorageTiering;

    /** uint64 */
    Version?: string;
}

interface TTtl {
    ColumnName?: string;

    ExpireAfterSeconds?: number;

    /** uint64 */
    ExpireAfterBytes?: string;

    ColumnUnit?: EUnit;
}

interface TStorageTier {
    Name?: string;
    Eviction?: TTtl;
}
interface TStorageTiering {
    Tiers?: TStorageTier[];
}

enum EUnit {
    UNIT_AUTO = 'UNIT_AUTO',
    UNIT_SECONDS = 'UNIT_SECONDS',
    UNIT_MILLISECONDS = 'UNIT_MILLISECONDS',
    UNIT_MICROSECONDS = 'UNIT_MICROSECONDS',
    UNIT_NANOSECONDS = 'UNIT_NANOSECONDS',
}

interface TColumnTableSharding {
    /** uint64 */
    Version?: string;

    /** uint64 */
    ColumnShards?: string[];

    /** uint64 */
    AdditionalColumnShards?: string[];

    UniquePrimaryKey?: boolean;

    RandomSharding?: {};
    HashSharding?: THashSharding;
}

interface THashSharding {
    Function?: EHashFunction;
    Columns?: string[];
    UniqueShardKey?: boolean;
    ActiveShardsCount?: number;
}
enum EHashFunction {
    HASH_FUNCTION_MODULO_N = 'HASH_FUNCTION_MODULO_N',
    HASH_FUNCTION_CLOUD_LOGS = 'HASH_FUNCTION_CLOUD_LOGS',
}
interface TColumnStorageConfig {
    SysLog?: TStorageSettings;
    Log?: TStorageSettings;
    Data?: TStorageSettings;
    DataChannelCount?: number;
}
interface TStorageSettings {
    PreferredPoolKind?: string;
    AllowOtherKinds?: boolean;
}
export interface TColumnStoreDescription {
    Name?: string;
    ColumnShardCount?: number;

    /** uint64 */
    ColumnShards?: string[];

    SchemaPresets?: TColumnTableSchemaPreset[];
    StorageConfig?: TColumnStorageConfig;

    NextSchemaPresetId?: number;
    NextTtlSettingsPresetId?: number;
}

interface TColumnTableSchemaPreset {
    Id?: number;
    Name?: string;
    Schema?: TColumnTableSchema;
}

interface TTablePartition {
    /** bytes */
    EndOfRangeKeyPrefix?: unknown;
    IsPoint?: boolean;
    IsInclusive?: boolean;
    /** uint64 */
    DatashardId?: string;
}
