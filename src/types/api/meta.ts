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
    endpoint?: string;
    versions?: MetaClusterVersion[];
}

export interface MetaBaseClusters {
    clusters: MetaBaseClusterInfo[];
}

export interface MetaBaseClusterInfo {
    owner?: string;
    location?: string;
    image?: string;
    title?: string;
    mvp_token?: string;
    name?: string;
    status?: string;
    scale?: number;
    environment?: string;
    control_plane?: string;
    description?: string;
    balancer?: string;
    service?: string;
    use_embedded_ui?: boolean;

    // Depending on meta version, these fields could be stringified objects or valid JSON
    solomon?: string | MetaClusterMonitoringData;
    cores?: string | MetaClusterCoresUrl;
    logging?: string | MetaClusterLogsUrls;
    trace_view?: string | MetaClusterTraceView;
    trace_check?: string | MetaClusterTraceCheck;

    // Settings are returned only by meta versions, that decode values by itself
    settings?: MetaClusterSettings;
}

export interface MetaGeneralClusterInfo extends MetaBaseClusterInfo {
    cluster?: MetaViewerClusterInfo;
}

// In case of error in viewer /cluster request mvp return error field instead of cluster data
export type MetaViewerClusterInfo = TClusterInfo & {
    error?: string;
};

export interface MetaClusterVersion {
    version: string;
    version_base_color_index?: number;
    count: number;
    role: string;
}

export interface MetaClusterMonitoringData {
    monitoring_url: string;

    serverless_dashboard?: string;
    dedicated_dashboard?: string;
    cluster_dashboard?: string;

    host?: string;
    slot?: string;

    cluster_name?: string;
}
export interface MetaClusterCoresUrl {
    url?: string;
}
export interface MetaClusterLogsUrls {
    url?: string;
    slo_logs_url?: string;
    monium_cluster?: string;
}
export interface MetaClusterTraceView {
    url?: string;
}
export interface MetaClusterTraceCheck {
    url?: string;
}

export interface MetaClusterSettings {
    use_meta_proxy?: boolean;
    proxy?: unknown;
}
