import type {MetaClusterSettings, MetaExtendedClusterInfo} from '../../../types/api/meta';
import type {PreparedVersion} from '../../../utils/versions/types';

export interface PreparedCluster extends Omit<MetaExtendedClusterInfo, 'settings'> {
    preparedVersions: PreparedVersion[];
    preparedBackend?: string;
    settings?: MetaClusterSettings;
    clusterDomain?: string;
    clusterExternalName?: string;
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
