import type {DDiskComponentStatus, TDDiskStateInfo} from './ddisk';

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
    PersistentBufferId?: string;
    DDiskTabletCount?: number;
    PersistentBufferTabletCount?: number;
    Available?: boolean;
    State?: string;
    DDiskOccupancy?: number;
    PersistentBufferOccupancy?: number;
    DDiskStatus?: DDiskComponentStatus;
    PersistentBufferStatus?: DDiskComponentStatus;
    DDiskStatusReason?: string;
    PersistentBufferStatusReason?: string;
    AllocatedSize?: number | string;
    AvailableSize?: number | string;
    TotalSize?: number | string;
}

export type NbsGroupBy = 'degrade' | 'disk_usage' | 'state';

export interface NbsListParams {
    offset?: number;
    limit?: number;
    filter?: string;
    sort_by?: string;
    sort_desc?: boolean;
    only_problems?: boolean;
    group_by?: NbsGroupBy;
    filter_group?: string;
    filter_tablet_id?: string;
    include_tablet_ids?: boolean;
    groups_only?: boolean;
    inventory?: boolean;
    fields_required?: string;
    timeout?: number;
    node_id?: number;
    pdisk_id?: number;
    tablet_id?: string;
}

export interface NbsListResponse {
    Status?: {Code?: string; Reason?: string};
    TotalCount?: number;
    UnfilteredCount?: number;
    FieldsAvailable?: string[];
    Tablets?: NbsTablet[];
    Disks?: NbsDisk[];
    Groups?: {Name: string; Count: number}[];
}

export type NbsGroupMemberId = Partial<NbsDisk['DiskId']>;

export interface NbsDirectBlockGroup {
    DirectBlockGroupId?: string | number;
    NumVChunksClaimed?: number;
    DDiskId?: NbsGroupMemberId[];
    PersistentBufferDDiskId?: NbsGroupMemberId[];
}

export type NbsTabletSlot = Omit<TDDiskStateInfo, 'AllocatedSize' | 'AvailableSize' | 'TotalSize'> &
    Pick<NbsDisk, 'AllocatedSize' | 'AvailableSize' | 'TotalSize'>;

export interface NbsTabletResponse {
    Status?: string;
    ErrorReason?: string;
    TabletId?: string;
    Revision?: string | number;
    Groups?: NbsDirectBlockGroup[];
    Slots?: NbsTabletSlot[];
}
