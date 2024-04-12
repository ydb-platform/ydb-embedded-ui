import type {MetaExtendedClusterInfo} from '../../../types/api/meta';
import type {ExtendedMetaClusterVersion} from '../../../utils/clusterVersionColors';

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

export interface ClustersStateSlice {
    clusters: ClustersFilters;
}
