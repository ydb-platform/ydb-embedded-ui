import type {ClusterTab} from '../../../containers/Cluster/utils';
import type {TClusterInfo} from '../../../types/api/cluster';

export interface DiskErasureGroupsStats {
    diskType: string;
    erasure: string;
    createdGroups: number;
    totalGroups: number;
    allocatedSize: number;
    availableSize: number;
}

/** Keys - erasure types */
export type DiskGroupsStats = Record<string, DiskErasureGroupsStats>;

/** Keys - PDisks types */
export type ClusterGroupsStats = Record<string, DiskGroupsStats>;

export interface ClusterState {
    defaultClusterTab: ClusterTab;
    clusterTitle?: string;
}

export interface HandledClusterResponse {
    clusterData: TClusterInfo;
    groupsStats: ClusterGroupsStats;
}
