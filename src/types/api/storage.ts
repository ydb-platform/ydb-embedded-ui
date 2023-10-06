import {EFlag} from './enums';
import {TVDiskStateInfo} from './vdisk';

/**
 * endpoint: /viewer/json/storage
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
}

export interface TStorageGroupInfoV2 extends TStorageGroupInfo {
    PoolName?: string;
    Kind?: string;

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

export type TStorageGroupInfo = TBSGroupStateInfo & THiveStorageGroupStats;

interface TBSGroupStateInfo {
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

export enum EVersion {
    v1 = 'v1',
    v2 = 'v2', // only this versions works with sorting
}
