import {EFlag} from './enums';
import {TVDiskStateInfo} from './vdisk';

/**
 * endpoint: /viewer/json/storage
 * 
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TStorageInfo {
    Overall?: EFlag;
    StoragePools?: TStoragePoolInfo[];
    /** uint64 */
    TotalGroups?: string;
    /** uint64 */
    FoundGroups?: string;
}

interface TStoragePoolInfo {
    Overall?: EFlag;
    Name?: string;
    Kind?: string;
    Groups?: (TBSGroupStateInfo & THiveStorageGroupStats)[];
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
}

export interface TBSGroupStateInfo {
    GroupID?: number;
    ErasureSpecies?: string;
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
