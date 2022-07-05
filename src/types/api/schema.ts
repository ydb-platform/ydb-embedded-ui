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

enum EStatus  {
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
    TableStats?: unknown;
    TabletMetrics?: unknown;
    TablePartitions?: unknown[];

    ColumnStoreDescription?: unknown;
    ColumnTableDescription?: unknown;
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

// incomplete
export enum EPathType {
    EPathTypeInvalid = 'EPathTypeInvalid',
    EPathTypeDir = 'EPathTypeDir',
    EPathTypeTable = 'EPathTypeTable',
    EPathTypeSubDomain = 'EPathTypeSubDomain',
    EPathTypeColumnStore = 'EPathTypeColumnStore',
    EPathTypeColumnTable = 'EPathTypeColumnTable',
    EPathTypeTableIndex = 'EPathTypeTableIndex', 
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

// incomplete
interface TPathVersion {
    /** uint64 */
    GeneralVersion?: string;
}
