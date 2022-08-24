enum EFlag {
    Grey = 'Grey',
    Green = 'Green',
    Yellow = 'Yellow',
    Orange = 'Orange',
    Red = 'Red',
}

export enum TPDiskState {
    Initial = 'Initial',
    InitialFormatRead = 'InitialFormatRead',
    InitialFormatReadError = 'InitialFormatReadError',
    InitialSysLogRead = 'InitialSysLogRead',
    InitialSysLogReadError = 'InitialSysLogReadError',
    InitialSysLogParseError = 'InitialSysLogParseError',
    InitialCommonLogRead = 'InitialCommonLogRead',
    InitialCommonLogReadError = 'InitialCommonLogReadError',
    InitialCommonLogParseError = 'InitialCommonLogParseError',
    CommonLoggerInitError = 'CommonLoggerInitError',
    Normal = 'Normal',
    OpenFileError = 'OpenFileError',
    ChunkQuotaError = 'ChunkQuotaError',
    DeviceIoError = 'DeviceIoError',

    Missing = 'Missing',
    Timeout = 'Timeout',
    NodeDisconnected = 'NodeDisconnected',
    Unknown = 'Unknown',
}

export interface TPDiskStateInfo {
    PDiskId?: number;
    /** uint64 */
    CreateTime?: string;
    /** uint64 */
    ChangeTime?: string;
    Path?: string;
    /** uint64 */
    Guid?: string;
    /** uint64 */
    Category?: string;
    /** uint64 */
    AvailableSize?: string;
    /** uint64 */
    TotalSize?: string;
    State?: TPDiskState;
    NodeId?: number;
    Count?: number;
    Device?: EFlag;
    Realtime?: EFlag;
    StateFlag?: EFlag;
    Overall?: EFlag;
    SerialNumber?: string;
}

export enum EVDiskState {
    Initial = 'Initial',
    LocalRecoveryError = 'LocalRecoveryError',
    SyncGuidRecovery = 'SyncGuidRecovery',
    SyncGuidRecoveryError = 'SyncGuidRecoveryError',
    OK = 'OK',
    PDiskError = 'PDiskError',
}

interface TRank {
    /**
     * Rank in percents; 0-100% is good; >100% is bad.
     * Formula for rank calculation is the following:
     * Rank = actual_value / max_allowed_value * 100
     */
    RankPercent?: number;

    /**
     * Flag is the Rank transformed to something simple
     * to understand: Green, Yellow or Red
     */
    Flag?: EFlag;
}

interface TVDiskSatisfactionRank {
    FreshRank?: TRank;
    LevelRank?: TRank;
}

interface TVDiskID {
    GroupID?: number;
    GroupGeneration?: number;
    Ring?: number;
    Domain?: number;
    VDisk?: number;
}

export interface TVSlotId {
    NodeId?: number;
    PDiskId?: number;
    VSlotId?: number;
}

export interface TVDiskStateInfo {
    VDiskId?: TVDiskID;
    /** uint64 */
    CreateTime?: string;
    /** uint64 */
    ChangeTime?: string;
    PDisk?: TPDiskStateInfo;
    VDiskSlotId?: number;
    /** uint64 */
    Guid?: string;
    /** uint64 */
    Kind?: string;
    NodeId?: number;
    Count?: number;

    Overall?: EFlag;

    /** Current state of VDisk */
    VDiskState?: EVDiskState;
    /** Disk space flags */
    DiskSpace?: EFlag;
    /** Compaction satisfaction rank */
    SatisfactionRank?: TVDiskSatisfactionRank;
    /** Is VDisk replicated? (i.e. contains all blobs it must have) */
    Replicated?: boolean;
    /** Does this VDisk has any yet unreplicated phantom-like blobs? */
    UnreplicatedPhantoms?: boolean;
    /** The same for the non-phantom-like blobs. */
    UnreplicatedNonPhantoms?: boolean;
    /**
     * uint64
     * How many unsynced VDisks from current BlobStorage group we see
     */
    UnsyncedVDisks?: string;
    /**
     * uint64
     * How much this VDisk have allocated on corresponding PDisk
     */
    AllocatedSize?: string;
    /**
     * uint64
     * How much space is available for VDisk corresponding to PDisk's hard space limits
     */
    AvailableSize?: string;
    /** Does this disk has some unreadable but not yet restored blobs? */
    HasUnreadableBlobs?: boolean;
    /** fixed64 */
    IncarnationGuid?: string;
    DonorMode?: boolean;
    /**
     * fixed64
     * VDisk actor instance guid
     */
    InstanceGuid?: string;
    // in reality it is `Donors: TVDiskStateInfo[] | TVSlotId[]`, but this way it is more error-proof
    Donors?: Array<TVDiskStateInfo | TVSlotId>;

    /** VDisk (Skeleton) Front Queue Status */
    FrontQueues?: EFlag;

    /** VDisk storage pool label */
    StoragePoolName?: string;

    /**
     * uint64
     * Read bytes per second from PDisk for TEvVGet blobs only
     */
    ReadThroughput?: string;
    /**
     * uint64
     * Write bytes per second to PDisk for TEvVPut blobs and replication bytes only
     */
    WriteThroughput?: string;
}

export interface TBSGroupStateInfo {
    /** uint32 */
    GroupID?: string;
    ErasureSpecies?: string;
    VDisks?: TVDiskStateInfo[];
    /** uint64 */
    ChangeTime?: string;
    /** uint32 */
    NodeId?: string; // filled during merge
    /** uint32 */
    GroupGeneration?: string;
    Overall?: EFlag;
    Latency?: EFlag;
    /** uint32 */
    Count?: string; // filled during group count
    StoragePoolName?: string; // from BS_CONTROLLER
}

export interface TStoragePoolInfo {
    Overall?: EFlag;
    Name?: string;
    Kind?: string;
    Groups?: TBSGroupStateInfo[];
    /** uint64 */
    AcquiredUnits?: string;
    AcquiredIOPS?: number;
    /** uint64 */
    AcquiredThroughput?: string;
    /** uint64 */
    AcquiredSize?: string;
    MaximumIOPS?: number;
    /** uint64 */
    MaximumThroughput?: string;
    /** uint64 */
    MaximumSize?: string;
}

export interface TStorageInfo {
    Overall?: EFlag;
    StoragePools?: TStoragePoolInfo[];
    /** uint64 */
    TotalGroups?: string;
    /** uint64 */
    FoundGroups?: string;
}
