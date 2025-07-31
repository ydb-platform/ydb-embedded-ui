import type {MetaExtendedClusterInfo} from '../../../types/api/meta';
import type {PreparedVersion} from '../../../utils/versions/types';

export interface PreparedCluster extends MetaExtendedClusterInfo {
    preparedVersions: PreparedVersion[];
    preparedBackend?: string;
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
