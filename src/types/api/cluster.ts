import type {EFlag} from './enums';
import type {Erasure} from './storage';
import type {TTabletStateInfo} from './tablet';

/**
 * endpoint: viewer/json/cluster
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TClusterInfoV1 {
    error?: string;
    Overall?: EFlag;
    NodesTotal?: number;
    NodesAlive?: number;
    NumberOfCpus?: number;
    RealNumberOfCpus?: number;
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
}

export interface TStorageStats {
    PDiskFilter?: string;
    ErasureSpecies?: Erasure;
    CurrentAvailableSize?: string;
    /** uint64 */
    CurrentAllocatedSize?: string;
    CurrentGroupsCreated?: number;
    AvailableGroupsToCreate?: number;
}

export interface TClusterInfoV2 extends TClusterInfoV1 {
    MapDataCenters?: {
        [key: string]: number;
    };
    MapNodeRoles?: {
        [key: string]: number;
    };
    MapNodeStates?: Partial<Record<EFlag, number>>;
    /** value is uint64 */
    MapStorageTotal?: {
        [key: string]: string;
    };
    /** value is uint64 */
    MapStorageUsed?: {
        [key: string]: string;
    };
    MapVersions?: {
        [key: string]: number;
    };
    StorageStats?: TStorageStats[];
    Version?: number;
    /** value is uint64 */
    CoresUsed?: string;
    CoresTotal?: number;
}

export interface TClusterInfoV5 extends TClusterInfoV2 {
    /** value is float */
    NetworkUtilization?: number;
    /** value is uint64 */
    NetworkWriteThroughput?: string;
    BridgeInfo?: TBridgeInfo;
}

export type TClusterInfo = TClusterInfoV1 | TClusterInfoV2 | TClusterInfoV5;

export function isClusterInfoV2(info?: TClusterInfo): info is TClusterInfoV2 {
    return isClusterParticularVersionOrHigher(info, 2);
}
export function isClusterInfoV5(info?: TClusterInfo): info is TClusterInfoV5 {
    return isClusterParticularVersionOrHigher(info, 5);
}

function isClusterParticularVersionOrHigher(info: TClusterInfo | undefined, version: number) {
    return Boolean(
        info && 'Version' in info && typeof info.Version === 'number' && info.Version >= version,
    );
}

export interface TBridgePile {
    /** unique pile identifier */
    PileId?: number;
    /** pile name, e.g., r1 */
    Name?: string;
    /** pile state (string from backend, e.g., SYNCHRONIZED) */
    State?: string;
    /** whether this pile is primary */
    IsPrimary?: boolean;
    /** number of nodes in the pile */
    Nodes?: number;
}

export interface TBridgeInfo {
    Piles?: TBridgePile[];
}
