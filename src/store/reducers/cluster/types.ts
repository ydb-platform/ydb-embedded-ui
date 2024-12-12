import type {ClusterTab} from '../../../containers/Cluster/utils';

export interface DiskErasureGroupsStats {
    diskType: string;
    erasure: string;
    createdGroups: number;
    totalGroups: number;
    allocatedSize: number;
    availableSize: number;
}

/** Keys - erasure types */
type DiskGroupsStats = Record<string, DiskErasureGroupsStats>;

/** Keys - PDisks types */
export type ClusterGroupsStats = Record<string, DiskGroupsStats>;

export interface ClusterState {
    defaultClusterTab: ClusterTab;
}
