// Matches proto3 definition from Ydb.Monitoring package
export enum SelfCheckResult {
    UNSPECIFIED = 'UNSPECIFIED',
    GOOD = 'GOOD',
    DEGRADED = 'DEGRADED',
    MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
    EMERGENCY = 'EMERGENCY',
}

export enum StatusFlag {
    UNSPECIFIED = 'UNSPECIFIED',
    GREY = 'GREY',
    GREEN = 'GREEN',
    BLUE = 'BLUE',
    YELLOW = 'YELLOW',
    ORANGE = 'ORANGE',
    RED = 'RED',
}

interface LocationNode {
    id?: number;
    host?: string;
    port?: number;
}

interface LocationStoragePDisk {
    id?: string;
    path?: string;
}

interface LocationStorageVDisk {
    id?: string[];
    pdisk?: LocationStoragePDisk[];
}

interface LocationStorageGroup {
    id?: string[];
    vdisk?: LocationStorageVDisk;
}

interface LocationStoragePool {
    name?: string;
    group?: LocationStorageGroup;
}

interface LocationStorage {
    node?: LocationNode;
    pool?: LocationStoragePool;
}

interface LocationComputePool {
    name?: string;
}

interface LocationComputeTablet {
    type?: string;
    id?: string[];
    count?: number;
}

interface LocationComputeSchema {
    type?: string;
    path?: string;
}

interface LocationCompute {
    node?: LocationNode;
    pool?: LocationComputePool;
    tablet?: LocationComputeTablet;
    schema?: LocationComputeSchema;
}

interface LocationDatabase {
    name?: string;
}

export interface Location {
    storage?: LocationStorage;
    compute?: LocationCompute;
    database?: LocationDatabase;
    node?: LocationNode;
    peer?: LocationNode;
}

export interface IssueLog {
    id: string;
    status?: StatusFlag;
    message?: string;
    location?: Location;
    reason?: string[];
    type?: string;
    level?: number;
    listed?: number;
    count?: number;
}

interface StoragePDiskStatus {
    id?: string;
    overall?: StatusFlag;
}

interface StorageVDiskStatus {
    id?: string;
    overall?: StatusFlag;
    vdisk_status?: StatusFlag;
    pdisk?: StoragePDiskStatus;
}

interface StorageGroupStatus {
    id?: string;
    overall?: StatusFlag;
    vdisks?: StorageVDiskStatus[];
}

interface StoragePoolStatus {
    id?: string;
    overall?: StatusFlag;
    groups?: StorageGroupStatus[];
}

interface StorageStatus {
    overall?: StatusFlag;
    pools?: StoragePoolStatus[];
}

interface ComputeTabletStatus {
    overall?: StatusFlag;
    type?: string;
    state?: string;
    count?: number;
    id?: string[];
}

interface ThreadPoolStatus {
    overall?: StatusFlag;
    name?: string;
    usage?: number;
}

interface LoadAverageStatus {
    overall?: StatusFlag;
    load?: number;
    cores?: number;
}

interface ComputeNodeStatus {
    id?: string;
    overall?: StatusFlag;
    tablets?: ComputeTabletStatus[];
    pools?: ThreadPoolStatus[];
    load?: LoadAverageStatus;
}

interface ComputeStatus {
    overall?: StatusFlag;
    nodes?: ComputeNodeStatus[];
    tablets?: ComputeTabletStatus[];
    paths_quota_usage?: number;
    shards_quota_usage?: number;
}

interface DatabaseStatus {
    name?: string;
    overall?: StatusFlag;
    storage?: StorageStatus;
    compute?: ComputeStatus;
}

export interface HealthCheckAPIResponse {
    self_check_result?: SelfCheckResult;

    issue_log?: IssueLog[];

    database_status?: DatabaseStatus[];
    location?: LocationNode;
}
