import type {MetaExtendedClusterInfo} from '../../../types/api/meta';
import type {ExtendedMetaClusterVersion} from '../../../utils/clusterVersionColors';

export interface PreparedCluster extends MetaExtendedClusterInfo {
    preparedVersions: ExtendedMetaClusterVersion[];
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
