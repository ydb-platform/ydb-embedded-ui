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
    Table?: unknown;
    TableStats?: TTableStats;
    TabletMetrics?: unknown;
    TablePartitions?: unknown[];

    ColumnStoreDescription?: unknown;
    ColumnTableDescription?: unknown;

    TableIndex?: TIndexDescription;
}

interface TDirEntry {
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

// incomplete
export enum EPathType {
    EPathTypeInvalid = 'EPathTypeInvalid',
    EPathTypeDir = 'EPathTypeDir',
    EPathTypeTable = 'EPathTypeTable',

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
