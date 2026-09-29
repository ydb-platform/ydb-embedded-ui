/** A Direct Disk slot and its Persistent Buffer share one PDisk owner. */
export interface TDDiskStateInfo {
    NodeId?: number;
    PDiskId?: number;
    DDiskSlotId?: number;
    GroupId?: number;
    AllocatedSize?: string;
    AvailableSize?: string;
    TotalSize?: string;
    DDiskOccupancy?: number;
    PersistentBufferOccupancy?: number;
    PersistentBufferId?: string;
    DDiskPath?: string;
    HasWhiteboardData?: boolean;
    ChangeTime?: string;
}
