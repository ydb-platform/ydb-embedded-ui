import type {
    MetaBaseClusterInfo,
    MetaClusterCoresUrl,
    MetaClusterLinks,
    MetaClusterLogsUrls,
    MetaClusterSettings,
    MetaClusterTraceView,
    MetaExtendedClusterInfo,
} from '../../../types/api/meta';
import type {PreparedVersion} from '../../../utils/versions/types';

export interface PreparedCluster extends Omit<MetaExtendedClusterInfo, 'name' | 'title'> {
    name: string | undefined;
    title: string | undefined;
    preparedVersions: PreparedVersion[];
    preparedComputeVersions: PreparedVersion[];
    preparedStorageVersions: PreparedVersion[];
    preparedBackend?: string;
    settings: MetaClusterSettings | undefined;
    links: MetaClusterLinks | undefined;
    cores: MetaClusterCoresUrl | undefined;
    logging: MetaClusterLogsUrls | undefined;
    monitoring: MetaBaseClusterInfo['solomon'];
    traceView: MetaClusterTraceView | undefined;
    clusterDomain?: string;
    clusterExternalName?: string;
}

export interface ClustersFilters {
    status: string[];
    service: string[];
    version: string[];
    galaxy: string[];
    clusterName: string;
}

export interface ClustersStateSlice {
    clusters: ClustersFilters;
}
