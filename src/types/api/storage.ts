import type {BackendSortParam, SchemaPathParam} from './common';
import type {ECapacityAlert, EFlag} from './enums';
import type {EDecommitStatus, EDriveStatus, EMaintenanceStatus, TPDiskStateInfo} from './pdisk';
import type {EVDiskStatus, TVDiskStateInfo} from './vdisk';

/**
 * endpoint: /storage/groups
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/storage_groups.h
 */
export interface StorageGroupsResponse {
    Version?: number;
    TotalGroups?: number;
    FoundGroups?: number;
    FieldsAvailable?: string;
    FieldsRequired?: string;
    NeedFilter?: boolean;
    NeedGroup?: boolean;
    NeedSort?: boolean;
    NeedLimit?: boolean;
    CachedDataMaxAge?: string;
    Problems?: string[];
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
    /** uint32; group slot weight in allocation units. */
    GroupSizeInUnits?: number;
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

    // Capacity metrics experiment
    MaxPDiskUsage?: number;
    MaxVDiskSlotUsage?: number;
    MaxVDiskRawUsage?: number;
    MaxNormalizedOccupancy?: number;
    CapacityAlert?: ECapacityAlert | string;
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
    MaintenanceStatus?: EMaintenanceStatus;
    /** uint64 */
    SlotSize?: string;
    /** uint64 */
    SlotCount?: string;
    Whiteboard?: TPDiskStateInfo;
}

/**
 * https://ydb.tech/docs/en/concepts/topology#cluster-config
 */
export type Erasure = 'none' | 'block-4-2' | 'mirror-3-dc' | 'mirror-3of4';

// ==== Request types ====

/**
 * Values to sort /storage/groups response
 */
export type GroupsSortField =
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
    | 'AllocationUnits'
    | 'Latency'
    | 'DiskSpaceUsage'
    | 'State'
    | 'MaxPDiskUsage'
    | 'MaxVDiskSlotUsage'
    | 'MaxVDiskRawUsage'
    | 'MaxNormalizedOccupancy'
    | 'CapacityAlert'
    | 'MissingDisks'
    | 'Available'
    | 'Encryption';

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
    | 'Latency'
    | 'CapacityAlert';

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
    | 'GroupSizeInUnits'
    | 'Read'
    | 'Write'
    | 'PDisk'
    | 'VDisk'
    | 'Latency'
    | 'MaxPDiskUsage'
    | 'MaxVDiskSlotUsage'
    | 'MaxVDiskRawUsage'
    | 'MaxNormalizedOccupancy'
    | 'CapacityAlert';

export interface GroupsRequestParams {
    database?: string;
    pool?: string;
    with?: StorageWithFilter;
    /** PoolName or GroupId */
    filter?: string;
    offset?: number;
    limit?: number;

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

export type StorageStatsGroupBy = 'path' | 'tablet_type';

interface TStorageStatsSizeEntry {
    /** uint64 */
    StorageSize?: number;
    /** uint64 */
    StorageCount?: number;
    /** uint64 */
    DataSize?: number;
    /** uint64 */
    IndexSize?: number;
}

export interface TStorageStatsGroupEntry extends TStorageStatsSizeEntry {
    GroupId?: string;
}

export interface TStorageStatsMediaEntry extends TStorageStatsSizeEntry {
    Kind?: string;
}

export interface TStorageStatsPathTabletEntry extends TStorageStatsSizeEntry {
    TabletId?: string;
    Type?: string;
}

export interface TStorageStatsPathEntry extends TStorageStatsSizeEntry {
    Path?: string;
    FullPath?: string;
    Groups?: number | TStorageStatsGroupEntry[];
    Media?: number | TStorageStatsMediaEntry[];
    Tablets?: number | TStorageStatsPathTabletEntry[];
}

export interface TStorageStatsTabletTypeEntry extends TStorageStatsSizeEntry {
    Type?: string;
    TabletCount?: number;
    Groups?: number | TStorageStatsGroupEntry[];
    Media?: number | TStorageStatsMediaEntry[];
}

export enum EStorageStatsProblem {
    DataIncomplete = 'data-incomplete',
}

export interface StorageStatsResponse {
    Problems?: string[];
    Paths?: TStorageStatsPathEntry[];
    Tablets?: TStorageStatsTabletTypeEntry[];
}

export interface StorageStatsRequestParams {
    database: string;
    path?: SchemaPathParam;
    groupBy?: StorageStatsGroupBy;
    everything?: boolean;
    groups?: boolean;
    tablets?: boolean;
    media?: boolean;
}
