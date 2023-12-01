import type {TClusterInfo} from '../../../types/api/cluster';
import type {IResponseError} from '../../../types/api/error';
import type {ApiRequestAction} from '../../utils';

import {FETCH_CLUSTER} from './cluster';

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
    loading: boolean;
    wasLoaded: boolean;
    data?: TClusterInfo;
    error?: IResponseError;
    groupsStats?: ClusterGroupsStats;
}

export interface HandledClusterResponse {
    clusterData: TClusterInfo;
    groupsStats: ClusterGroupsStats;
}

export type ClusterAction = ApiRequestAction<
    typeof FETCH_CLUSTER,
    HandledClusterResponse,
    IResponseError
>;
