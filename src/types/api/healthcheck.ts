export enum SelfCheckResult {
    UNSPECIFIED = 'UNSPECIFIED',
    GOOD = 'GOOD',
    DEGRADED = 'DEGRADED',
    MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
    EMERGENCY = 'EMERGENCY',
}

enum StatusFlag {
    UNSPECIFIED = 'UNSPECIFIED',
    GREY = 'GREY',
    GREEN = 'GREEN',
    BLUE = 'BLUE',
    YELLOW = 'YELLOW',
    ORANGE = 'ORANGE',
    RED = 'RED',
}

interface LocationNode {
    id: number;
    host: string;
    port: number;
}

interface LocationStoragePDisk {
    id: string;
    path: string;
}

interface LocationStorageVDisk {
    id: string;
    pdisk: LocationStoragePDisk;
}

interface LocationStorageGroup {
    id: string;
    vdisk: LocationStorageVDisk;
}

interface LocationStoragePool {
    name: string;
    group: LocationStorageGroup;
}

interface LocationStorage {
    node: LocationNode;
    pool: LocationStoragePool;
}

interface LocationComputePool {
    name: string;
}

interface LocationComputeTablet {
    type: string;
    id?: string[];
    count: number;
}

interface LocationCompute {
    node: LocationNode;
    pool: LocationComputePool;
    tablet: LocationComputeTablet;
}

interface LocationDatabase {
    name: string;
}

interface Location {
    storage: LocationStorage;
    compute: LocationCompute;
    database: LocationDatabase;
}

interface IssueLog {
    id: string;
    status: StatusFlag;
    message: string;
    location: Location;
    reason?: string[];
    type: string;
    level: number;
}

export interface HealthCheckAPIResponse {
    // eslint-disable-next-line camelcase
    self_check_result: SelfCheckResult;
    // eslint-disable-next-line camelcase
    issue_log?: IssueLog[];
}
