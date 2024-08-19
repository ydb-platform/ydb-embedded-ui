import type {TCdcStreamDescription} from './cdcStream';
import type {EColumnCodec, EUnit, TColumnDescription, TPathID, TStorageSettings} from './shared';
import type {TIndexDescription} from './tableIndex';

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

export interface TTableStats {
    /** uint64 */
    DataSize?: string;
    /** uint64 */
    RowCount?: string;
    /** uint64 */
    IndexSize?: string;
    /** uint64 */
    ByKeyFilterSize?: string;
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

export interface TFamilyDescription {
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

interface TChannelPurpose {
    Purpose?: EPurpose;
    Channel?: number;
}

interface TStorageConfig {
    SysLog?: TStorageSettings;
    Log?: TStorageSettings;
    Data?: TStorageSettings;
    External?: TStorageSettings;
    DataThreshold?: number;
    ExternalThreshold?: number;
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

enum EPurpose {
    SysLog = 'SysLog',
    Log = 'Log',
    Data = 'Data',
    External = 'External',
}

enum EFreezeState {
    Unspecified = 'Unspecified',
    Freeze = 'Freeze',
    Unfreeze = 'Unfreeze',
}

enum EColumnCache {
    ColumnCacheNone = 'ColumnCacheNone',
    ColumnCacheOnce = 'ColumnCacheOnce',
    ColumnCacheEver = 'ColumnCacheEver',
}

enum EColumnStorage {
    ColumnStorage1 = 'ColumnStorage1',
    ColumnStorage2 = 'ColumnStorage2',
    ColumnStorage1Ext1 = 'ColumnStorage1Ext1',
    ColumnStorage1Ext2 = 'ColumnStorage1Ext2',
    ColumnStorage2Ext1 = 'ColumnStorage2Ext1',
    ColumnStorage2Ext2 = 'ColumnStorage2Ext2',
    ColumnStorage1Med2Ext2 = 'ColumnStorage1Med2Ext2',
    ColumnStorage2Med2Ext2 = 'ColumnStorage2Med2Ext2',
    ColumnStorageTest_1_2_1k = 'ColumnStorageTest_1_2_1k',
}

enum ECompactionStrategy {
    CompactionStrategyUnset = 'CompactionStrategyUnset',
    CompactionStrategyGenerational = 'CompactionStrategyGenerational',
    CompactionStrategySharded = 'CompactionStrategySharded',
}
