import type {TClusterInfo} from './cluster';
import type {TTenant} from './tenant';

/**
 * endpoint: /api/meta/meta/clusters
 */
export interface MetaClusters {
    clusters?: MetaExtendedClusterInfo[];
}

export interface MetaCluster {
    cluster?: MetaGeneralClusterInfo;
}

export interface MetaTenants {
    databases?: TTenant[];
}

/** With fields present only in /api/meta/meta/clusters */
export interface MetaExtendedClusterInfo extends MetaGeneralClusterInfo {
    hosts?: Record<string, number>;
    versions?: MetaClusterVersion[];
}

export interface MetaGeneralClusterInfo {
    owner?: string;
    location?: string;
    image?: string;
    title?: string;
    endpoint?: string;
    mvp_token?: string;
    name?: string;
    solomon?: string;
    status?: string;
    scale?: number;
    environment?: string;
    control_plane?: string;
    description?: string;
    balancer?: string;
    service?: string;
    cluster?: MetaViewerClusterInfo;
}

// In case of error in viewer /cluster request mvp return error field instead of cluster data
export interface MetaViewerClusterInfo extends TClusterInfo {
    error?: string;
}

export interface MetaClusterVersion {
    version: string;
    version_base_color_index?: number;
    count: number;
    role: string;
}
