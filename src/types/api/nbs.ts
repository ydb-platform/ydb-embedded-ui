export interface NbsTablet {
    TabletId: string;
    DiskId?: string;
    Revision?: number;
    GroupsCount?: number;
    LastChangedAt?: string | number;
    UnavailableDDiskCount?: number;
    UnavailablePersistentBufferCount?: number;
    Degrade?: number;
    DiskUsage?: number;
}

export interface NbsDisk {
    DiskId: {NodeId: number; PDiskId: number; DDiskSlotId: number};
    StoragePoolName?: string;
    DDiskPath?: string;
    PersistentBufferId?: string;
    DDiskTabletCount?: number;
    PersistentBufferTabletCount?: number;
    Available?: boolean;
    State?: string;
    DDiskOccupancy?: number;
    PersistentBufferOccupancy?: number;
}

export interface NbsListParams {
    offset?: number;
    limit?: number;
    filter?: string;
    sort_by?: string;
    sort_desc?: boolean;
    only_problems?: boolean;
    group_by?: 'degrade' | 'disk_usage';
    filter_group?: string;
    filter_tablet_id?: string;
    include_tablet_ids?: boolean;
}

export interface NbsListResponse {
    Status?: {Code?: string; Reason?: string};
    TotalCount?: number;
    Tablets?: NbsTablet[];
    Disks?: NbsDisk[];
    Groups?: {Name: string; Count: number}[];
}
