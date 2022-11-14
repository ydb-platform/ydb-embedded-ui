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

// incomplete interface, only currently used fields are covered
interface TPathDescription {
    /** info about the path itself */
    Self?: TDirEntry;
    DomainDescription?: unknown;

    // for directory
    Children?: TDirEntry[];

    // for table
    Table?: TTableDescription;
    TableStats?: TTableStats;
    TabletMetrics?: unknown;
    TablePartitions?: unknown[];

    ColumnStoreDescription?: TColumnStoreDescription;
    ColumnTableDescription?: TColumnTableDescription;

    TableIndex?: TIndexDescription;

    CdcStreamDescription?: TCdcStreamDescription;
    PersQueueGroup?: TPersQueueGroupDescription;
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

// FIXME: incomplete
export interface TTableDescription {
    PartitionConfig?: TPartitionConfig;
}

// FIXME: incomplete
export interface TPartitionConfig {
    /** uint64 */
    FollowerCount?: string;
    /** @deprecated use FollowerGroups */
    CrossDataCenterFollowerCount?: number;
    /** 0 or 1 items */
    FollowerGroups?: TFollowerGroup[];
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

interface TTableStats {
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

interface TPathID {
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

enum EMeteringMode {
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

interface TPQPartitionConfig {
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

interface TPQTabletConfig {
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

    PartitionBoundaries?: any;

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
    Columns: TOlapColumnDescription[];
    KeyColumnNames: string[];
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

interface TColumnDataLifeCycle {
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
    Tiers: TStorageTier[];
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
    ColumnShards: string[];

    /** uint64 */
    AdditionalColumnShards: string[];

    UniquePrimaryKey?: boolean;

    RandomSharding?: {};
    HashSharding?: THashSharding;
}

interface THashSharding {
    Function?: EHashFunction;
    Columns: string[];
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
    ColumnShards: string[];

    SchemaPresets: TColumnTableSchemaPreset[];
    StorageConfig?: TColumnStorageConfig;

    NextSchemaPresetId?: number;
    NextTtlSettingsPresetId?: number;
}

interface TColumnTableSchemaPreset {
    Id?: number;
    Name?: string;
    Schema?: TColumnTableSchema;
}
