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

interface TBootstrapConfig {
    ExplicitMessageGroups?: TMessageGroup[];
}

interface TMessageGroup {
    // Id of message group (SourceId)
    Id?: string;
    // Range of the key to which it is allowed to write.
    KeyRange?: TPartitionKeyRange;
}

interface TKeyComponentSchema {
    Name?: string;
    TypeId?: number;
}

interface TReadQuota {
    ClientId?: string;
    /** uint64 */
    SpeedInBytesPerSecond?: string;
    /** uint64 */
    BurstSize?: string;
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

interface TPartitionKeyRange {
    // Inclusive left border. Emptiness means -inf.
    FromBound?: string;
    // Exclusive right border. Emptiness means +inf.
    ToBound?: string;
}

export enum EMeteringMode {
    METERING_MODE_RESERVED_CAPACITY = 'METERING_MODE_RESERVED_CAPACITY',
    METERING_MODE_REQUEST_UNITS = 'METERING_MODE_REQUEST_UNITS',
}
