import type {EFlag} from './enums';
import type {TMemoryStats, TPoolStats} from './nodes';
import type {TTabletStateInfo} from './tablet';

/**
 * endpoint: /viewer/json/tenants
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TTenants {
    Tenants?: TTenant[];
}

/**
 * endpoint: /viewer/json/tenantinfo
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TTenantInfo {
    TenantInfo?: TTenant[];
    Errors?: string[];
}

export interface TTenant {
    Name?: string;
    Id?: string;
    Type?: ETenantType;
    State?: State;
    StateStats?: THiveDomainStatsStateCount[];
    Metrics?: TMetrics;
    NodeIds?: number[];
    AliveNodes?: number;
    Resources?: TTenantResources;
    /** uint64 */
    CreateTime?: string;
    Owner?: string;
    Users?: string[];
    PoolStats?: TPoolStats[];
    UserAttributes?: UserAttributes;
    Overall?: EFlag;
    SystemTablets?: TTabletStateInfo[];
    ResourceId?: string;
    Tablets?: TTabletStateInfo[];
    /** uint64 */
    StorageAllocatedSize?: string; // Actual database size
    /** uint64 */
    StorageMinAvailableSize?: string;
    /** uint64 */
    MemoryUsed?: string; // Actual memory consumption
    /** uint64 */
    MemoryLimit?: string;
    MemoryStats?: TMemoryStats;
    /** double */
    CoresUsed?: number; // Actual cpu consumption
    /** uint64 */
    StorageGroups?: string;

    ControlPlane?: ControlPlane; // additional

    StorageAllocatedLimit?: string;
    DatabaseQuotas?: DatabaseQuotas;

    StorageUsage?: TStorageUsage[];
    QuotaUsage?: TStorageUsage[];

    /** value is float */
    NetworkUtilization?: number;
    /** value is uint64 */
    NetworkWriteThroughput?: string;
}

export interface THiveDomainStatsStateCount {
    VolatileState?: ETabletVolatileState;
    Count?: number;
}

export interface TMetrics {
    /** uint64 */
    CPU?: string; // Logical cpu consumption
    /** uint64 */
    Memory?: string; // Logical memory consumption
    /** uint64 */
    Network?: string;
    /** uint64 */
    Counter?: string;
    /** uint64 */
    Storage?: string; // Logical database size
    /** uint64 */
    ReadThroughput?: string;
    /** uint64 */
    WriteThroughput?: string;
    /** uint64 */
    ReadIops?: string;
    /** uint64 */
    WriteIops?: string;

    GroupReadThroughput?: TThroughputRecord[];
    GroupWriteThroughput?: TThroughputRecord[];

    GroupReadIops?: TIopsRecord[];
    GroupWriteIops?: TIopsRecord[];
}

interface TThroughputRecord {
    GroupID?: number;
    Channel?: number;
    /** uint64 */
    Throughput?: string;
}

interface TIopsRecord {
    GroupID?: number;
    Channel?: number;
    /** uint64 */
    Iops?: string;
}

export interface TTenantResources {
    Required?: TTenantResource[];
    Allocated?: TTenantResource[];
}

export interface TTenantResource {
    Type: string;
    Zone: string;
    Kind: string;
    Count: number;
}

/** incomplete */
export interface ControlPlane {
    name?: string;
    id?: string;
    endpoint?: string;
    folder_id?: string;
}
/** incomplete */
interface UserAttributes {
    database_id?: string;
    folder_id?: string;
}

export type ETenantType = 'UnknownTenantType' | 'Domain' | 'Dedicated' | 'Shared' | 'Serverless';

export enum State {
    'STATE_UNSPECIFIED' = 'STATE_UNSPECIFIED',
    'CREATING' = 'CREATING',
    'RUNNING' = 'RUNNING',
    'REMOVING' = 'REMOVING',
    'PENDING_RESOURCES' = 'PENDING_RESOURCES',
    'CONFIGURING' = 'CONFIGURING',
}

export enum ETabletVolatileState {
    'TABLET_VOLATILE_STATE_UNKNOWN' = 'TABLET_VOLATILE_STATE_UNKNOWN',
    'TABLET_VOLATILE_STATE_STOPPED' = 'TABLET_VOLATILE_STATE_STOPPED',
    'TABLET_VOLATILE_STATE_BOOTING' = 'TABLET_VOLATILE_STATE_BOOTING',
    'TABLET_VOLATILE_STATE_STARTING' = 'TABLET_VOLATILE_STATE_STARTING',
    'TABLET_VOLATILE_STATE_RUNNING' = 'TABLET_VOLATILE_STATE_RUNNING',
}

export interface DatabaseQuotas {
    /** uint64 */
    data_size_hard_quota?: string;
    /** uint64 */
    data_size_soft_quota?: string;
    /** uint64 */
    data_stream_shards_quota?: string;
    /** uint64 */
    data_stream_reserved_storage_quota?: string;
    /** uint32 */
    ttl_min_run_internal_seconds?: string;
}

interface TStorageUsage {
    Type: EType;
    /** uint64 */
    Size?: string;
    /** uint64 */
    Limit?: string;
}

export enum EType {
    None = 'None',
    HDD = 'HDD',
    SSD = 'SSD',
}
