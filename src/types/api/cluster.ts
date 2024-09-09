import type {EFlag} from './enums';
import type {TTabletStateInfo} from './tablet';
import type {TTraceCheck, TTraceView} from './trace';

/**
 * endpoint: viewer/json/cluster
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
interface TClusterInfoV1 {
    Name?: string;
    Overall?: EFlag;
    NodesTotal?: number;
    NodesAlive?: number;
    NumberOfCpus?: number;
    /** double */
    LoadAverage?: number;
    /** uint64 */
    MemoryTotal?: string;
    /** uint64 */
    MemoryUsed?: string;
    /** uint64 */
    StorageTotal?: string;
    /** uint64 */
    StorageUsed?: string;
    DataCenters?: string[];
    Versions?: string[];
    SystemTablets?: TTabletStateInfo[];
    /** uint64 */
    Hosts?: string;
    /** uint64 */
    Tenants?: string;
    /** uint64 */
    Tablets?: string;

    /** Cluster root database */
    Domain?: string;

    Balancer?: string; // additional
    Solomon?: string; // additional

    TraceView?: TTraceView;
    TraceCheck?: TTraceCheck;
}

export interface TStorageStats {
    PDiskFilter?: string;
    ErasureSpecies?: string;
    CurrentAvailableSize?: string;
    CurrentAllocatedSize?: string;
    CurrentGroupsCreated?: number;
    AvailableGroupsToCreate?: number;
}
export interface TClusterInfoV2 extends TClusterInfoV1 {
    MapDataCenters?: {
        [key: string]: number;
    };
    MapNodeStates?: Partial<Record<EFlag, number>>;
    MapStorageTotal?: {
        [key: string]: string;
    };
    MapStorageUsed?: {
        [key: string]: string;
    };
    MapVersions?: {
        [key: string]: number;
    };
    StorageStats?: TStorageStats[];
    Version?: number;
}

export type TClusterInfo = TClusterInfoV1 | TClusterInfoV2;

export function isClusterInfoV2(info?: TClusterInfo): info is TClusterInfoV2 {
    return info ? 'Version' in info && info.Version === 2 : false;
}
