import type {BackendSortParam} from './common';
import type {EFlag} from './enums';
import type {EDecommitStatus, EDriveStatus, TPDiskStateInfo} from './pdisk';
import type {EVDiskStatus, TVDiskStateInfo} from './vdisk';

/**
 * endpoint: /viewer/storage
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TStorageInfo {
    Overall?: EFlag;
    StoragePools?: TStoragePoolInfo[]; // v1
    StorageGroups?: TStorageGroupInfoV2[]; // v2
    /** uint64 */
    TotalGroups?: string;
    /** uint64 */
    FoundGroups?: string;
}

export interface TStoragePoolInfo {
    Overall?: EFlag;
    Name?: string;
    Kind?: string;
    Groups?: TStorageGroupInfo[];
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
    MediaType?: string;
}

export interface TStorageGroupInfoV2 extends TStorageGroupInfo {
    PoolName?: string;
    Kind?: string;
    MediaType?: string;

    /** uint64 */
    Degraded?: string;

    /** uint64 */
    Used: string;
    /** uint64 */
    Limit: string;
    /** uint64 */
    Read: string;
    /** uint64 */
    Write: string;

    /** uint64 */
    Usage?: string;
}

export type TStorageGroupInfo = TBSGroupStateInfo &
    THiveStorageGroupStats & {
        DiskSpace?: EFlag;
    };

interface TBSGroupStateInfo {
    GroupID?: number;
    ErasureSpecies?: Erasure;
    VDisks?: TVDiskStateInfo[];
    /** uint64 */
    ChangeTime?: string;
    NodeId?: number;
    GroupGeneration?: number;
    Overall?: EFlag;
    Latency?: EFlag;
    Count?: number;
    StoragePoolName?: string;
    /** uint64 */
    AllocatedSize?: string;
    /** uint64 */
    AvailableSize?: string;
    /** uint64 */
    ReadThroughput?: string;
    /** uint64 */
    WriteThroughput?: string;
    Encryption?: boolean;
}

interface THiveStorageGroupStats {
    GroupID?: number;
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
    /** uint64 */
    AllocatedSize?: string;
    /** uint64 */
    AvailableSize?: string;
}

/**
 * endpoint: /storage/groups
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/storage_groups.h
 */
export interface StorageGroupsResponse {
    Version?: number;
    TotalGroups?: number;
    FoundGroups?: number;
    FieldsAvailable?: number;
    FieldsRequired?: number;
    StorageGroups?: TGroupsStorageGroupInfo[];
    StorageGroupGroups?: StorageGroupGroups[];
}

export interface StorageGroupGroups {
    GroupName?: string;
    GroupCount?: string;
}

export interface TGroupsStorageGroupInfo {
    GroupId?: string;
    /** uint64 */
    GroupGeneration?: string;
    PoolName?: string;
    // Bridge mode
    PileName?: string;
    Encryption?: boolean;
    Overall?: EFlag;
    DiskSpace?: EFlag;
    Kind?: string;
    MediaType?: string;
    ErasureSpecies?: Erasure;
    /** uint64 */
    AllocationUnits?: string;
    /**
     * Could be one of:
     * ok - group is okay
     * starting:n - group is okay, but n disks are starting
     * replicating:n - group is okay, all disks are available, but n disks are replicating
     * degraded:n(m, m...) - group is okay, but n fail realms are not available (with m fail domains)
     * dead:n - group is not okay, n fail realms are not available
     */
    State?: string;
    /** uint64 */
    MissingDisks?: string;

    /** uint64 */
    Used?: string;
    /** uint64 */
    Limit?: string;
    /** uint64 */
    Available?: string;
    /** float */
    Usage?: number;
    /** uint64 */
    Read?: string;
    /** uint64 */
    Write?: string;
    /** float */
    DiskSpaceUsage?: number;

    /**
     * uint64
     *
     * time in us
     */
    LatencyPutTabletLog?: string;
    /**
     * uint64
     *
     * time in us
     */
    LatencyPutUserData?: string;
    /**
     * uint64
     *
     * time in us
     */
    LatencyGetFast?: string;

    VDisks?: TStorageVDisk[];
}

/**
 * VDisk data from storage/groups handler
 */
export interface TStorageVDisk {
    VDiskId?: string;
    NodeId?: number;
    /** uint64 */
    AllocatedSize?: string;
    /** uint64 */
    AvailableSize?: string;
    Status?: EVDiskStatus;
    DiskSpace?: EFlag;
    Donors?: TStorageVDisk[];
    PDisk?: TStoragePDisk;
    Whiteboard?: TVDiskStateInfo;
}

/**
 * PDisk data from storage/groups handler
 */
export interface TStoragePDisk {
    PDiskId?: string;
    Path?: string;
    Type?: 'hdd' | 'ssd' | 'nvme';
    Guid?: string;
    /** uint64 */
    Category?: string;
    /** uint64 */
    TotalSize?: string;
    /** uint64 */
    AvailableSize?: string;
    Status?: EDriveStatus;
    DiskSpace?: EFlag;
    DecommitStatus?: EDecommitStatus;
    /** uint64 */
    SlotSize?: string;
    Whiteboard?: TPDiskStateInfo;
}

/**
 * https://ydb.tech/docs/en/concepts/topology#cluster-config
 */
export type Erasure = 'none' | 'block-4-2' | 'mirror-3-dc' | 'mirror-3of4';

// ==== Request types ====

export type EVersion = 'v1' | 'v2'; // only v2 versions works with sorting

/**
 * Values to sort /viewer/storage v2 response
 */
export type StorageV2SortValue =
    | 'PoolName'
    | 'Kind'
    | 'MediaType'
    | 'Erasure'
    | 'Degraded'
    | 'Usage'
    | 'GroupId'
    | 'Used'
    | 'Limit'
    | 'Read'
    | 'Write'

    // These fields are not present in storage v2
    // So this sort does nothing
    // Added them here for types compatibility
    | 'AllocationUnits'
    | 'Latency'
    | 'DiskSpaceUsage'
    | 'State';

/**
 * Values to sort /storage/groups response
 */
export type GroupsSortField = StorageV2SortValue | 'MissingDisks' | 'Available' | 'Encryption';

export type StorageV2Sort = BackendSortParam<StorageV2SortValue>;
export type GroupsSort = BackendSortParam<GroupsSortField>;

export type StorageWithFilter = 'space' | 'missing' | 'all';

// v4
export type GroupsGroupByField =
    | 'GroupId'
    | 'Erasure'
    | 'Usage'
    | 'DiskSpaceUsage'
    | 'PoolName'
    | 'PileName'
    | 'Kind'
    | 'Encryption'
    | 'MediaType'
    | 'MissingDisks'
    | 'State'
    | 'Latency';

export type GroupsRequiredField =
    | 'GroupId' // always required
    | 'PoolName'
    | 'PileName'
    | 'Kind'
    | 'MediaType'
    | 'Erasure'
    | 'MissingDisks'
    | 'Degraded'
    | 'State'
    | 'Used'
    | 'Limit'
    | 'Usage'
    | 'Available'
    | 'DiskSpaceUsage'
    | 'Encryption'
    | 'AllocationUnits'
    | 'Read'
    | 'Write'
    | 'PDisk'
    | 'VDisk'
    | 'Latency';

interface BaseStorageRequestParams {
    /** @deprecated use database instead */
    tenant?: string;
    database?: string;
    pool?: string;
    with?: StorageWithFilter;
    /** PoolName or GroupId */
    filter?: string;
    offset?: number;
    limit?: number;
}

export interface StorageRequestParams extends BaseStorageRequestParams {
    nodeId?: string | number;
    pDiskId?: string | number;
    groupId?: string | number;

    sort?: StorageV2Sort;
    version?: EVersion;
}

export interface GroupsRequestParams extends BaseStorageRequestParams {
    nodeId?: string | number | (string | number)[];
    pDiskId?: string | number | (string | number)[];
    groupId?: string | number | (string | number)[];

    sort?: GroupsSort;
    group?: GroupsGroupByField;
    filter_group_by?: GroupsGroupByField;
    filter_group?: string;
    fieldsRequired?: GroupsRequiredField[] | 'all';

    /**
     * Backend timeout, default 10_000
     * 50% - BSC timeout
     */
    timeout?: number;
}
