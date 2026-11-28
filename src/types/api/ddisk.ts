export type DDiskComponentStatus = 'Ready' | 'Initializing' | 'Broken' | 'Stopping';

/** A Direct Disk slot and its Persistent Buffer share one PDisk owner. */
export interface TDDiskStateInfo {
    NodeId?: number;
    PDiskId?: number;
    DDiskSlotId?: number;
    GroupId?: number;
    StoragePoolName?: string;
    AllocatedSize?: string;
    AvailableSize?: string;
    TotalSize?: string;
    DDiskOccupancy?: number;
    PersistentBufferOccupancy?: number;
    PersistentBufferId?: string;
    DDiskPath?: string;
    HasWhiteboardData?: boolean;
    DDiskStatus?: DDiskComponentStatus;
    PersistentBufferStatus?: DDiskComponentStatus;
    DDiskStatusReason?: string;
    PersistentBufferStatusReason?: string;
    ChangeTime?: string;
}
