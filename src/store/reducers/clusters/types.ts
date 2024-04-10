import type {MetaExtendedClusterInfo} from '../../../types/api/meta';
import type {ExtendedMetaClusterVersion} from '../../../utils/clusterVersionColors';
import type {ApiRequestAction} from '../../utils';

import type {FETCH_CLUSTERS, changeClustersFilters} from './clusters';

export interface PreparedCluster extends MetaExtendedClusterInfo {
    preparedVersions: ExtendedMetaClusterVersion[];
}

export interface ClusterDataAggregation {
    NodesTotal: number;
    NodesAlive: number;
    Hosts: number;
    Tenants: number;
    LoadAverage: number;
    NumberOfCpus: number;
    StorageUsed: number;
    StorageTotal: number;
}

export interface ClustersFilters {
    status: string[];
    service: string[];
    version: string[];
    clusterName: string;
}

export interface ClustersState extends ClustersFilters {
    loading: boolean;
    error?: unknown;

    list: PreparedCluster[];
}

export type ClustersAction =
    | ApiRequestAction<typeof FETCH_CLUSTERS, PreparedCluster[], unknown>
    | ReturnType<typeof changeClustersFilters>;

export interface ClustersStateSlice {
    clusters: ClustersState;
}
