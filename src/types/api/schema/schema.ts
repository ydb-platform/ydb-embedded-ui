import type {TMetrics} from '../tenant';

import type {TCdcStreamDescription} from './cdcStream';
import type {TColumnStoreDescription, TColumnTableDescription} from './columnEntity';
import type {TExternalDataSourceDescription} from './externalDataSource';
import type {TExternalTableDescription} from './externalTable';
import type {TPersQueueGroupDescription} from './persQueueGroup';
import type {TReplicationDescription} from './replication';
import type {TSysViewDescription} from './sysView';
import type {TTableDescription, TTableStats} from './table';
import type {TIndexDescription} from './tableIndex';
import type {TViewDescription} from './view';

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/flat_tx_scheme.proto
 */
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

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/flat_scheme_op.proto
 *
 * incomplete interface, only currently used fields are covered
 */
export interface TPathDescription {
    /** info about the path itself */
    Self?: TDirEntry;
    DomainDescription?: TDomainDescription;
    UserAttributes?: TUserAttribute[];

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

    ViewDescription?: TViewDescription;
    SysViewDescription?: TSysViewDescription;

    ReplicationDescription?: TReplicationDescription;
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
    ChildrenExist?: boolean;
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
    Topics?: TTopics;
    TStoragePoolUsage?: TStoragePoolUsage[];
}

interface TTables {
    /** uint64 */
    TotalSize?: string;
    /** uint64 */
    DataSize?: string;
    /** uint64 */
    IndexSize?: string;
}

interface TTopics {
    /** uint64 */
    ReserveSize?: string;
    /** uint64 */
    AccountSize?: string;
    /** uint64 */
    DataSize?: string;
    /** uint64 */
    UsedReserveSize?: string;
}

interface TStoragePoolUsage {
    PoolKind?: string;
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

    data_size_hard_quota: string;

    /** uint64 */

    data_size_soft_quota: string;

    /** uint64 */

    data_stream_shards_quota: string;

    /** uint64 */

    data_stream_reserved_storage_quota: string;

    ttl_min_run_internal_seconds: number;
}

// incomplete
export enum EPathType {
    EPathTypeInvalid = 'EPathTypeInvalid',
    EPathTypeDir = 'EPathTypeDir',
    EPathTypeTable = 'EPathTypeTable',
    EPathTypePersQueueGroup = 'EPathTypePersQueueGroup',
    EPathTypeSubDomain = 'EPathTypeSubDomain',
    EPathTypeSysView = 'EPathTypeSysView',

    EPathTypeTableIndex = 'EPathTypeTableIndex',
    EPathTypeExtSubDomain = 'EPathTypeExtSubDomain',

    EPathTypeColumnStore = 'EPathTypeColumnStore',
    EPathTypeColumnTable = 'EPathTypeColumnTable',
    EPathTypeCdcStream = 'EPathTypeCdcStream',

    EPathTypeExternalDataSource = 'EPathTypeExternalDataSource',
    EPathTypeExternalTable = 'EPathTypeExternalTable',
    EPathTypeView = 'EPathTypeView',

    EPathTypeReplication = 'EPathTypeReplication',
    EPathTypeTransfer = 'EPathTypeTransfer',
    EPathTypeResourcePool = 'EPathTypeResourcePool',

    EPathTypeStreamingQuery = 'EPathTypeStreamingQuery',
}

export enum EPathSubType {
    EPathSubTypeEmpty = 'EPathSubTypeEmpty',
    EPathSubTypeSyncIndexImplTable = 'EPathSubTypeSyncIndexImplTable',
    EPathSubTypeAsyncIndexImplTable = 'EPathSubTypeAsyncIndexImplTable',
    EPathSubTypeStreamImpl = 'EPathSubTypeStreamImpl',
    EPathSubTypeVectorKmeansTreeIndexImplTable = 'EPathSubTypeVectorKmeansTreeIndexImplTable',
    EPathSubTypeFulltextIndexImplTable = 'EPathSubTypeFulltextIndexImplTable',
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

interface TTablePartition {
    /** bytes */
    EndOfRangeKeyPrefix?: unknown;
    IsPoint?: boolean;
    IsInclusive?: boolean;
    /** uint64 */
    DatashardId?: string;
}

interface TUserAttribute {
    Key?: string;
    Value?: string;
}
