import {ETenantType} from '../types/api/tenant';

export type ParsedMonitoringData = {
    monitoring_url: string;

    serverless_dashboard?: string;
    dedicated_dashboard?: string;
    cluster_dashboard?: string;

    host?: string;
    slot?: string;

    cluster_name?: string;
};

export interface GetMonitoringLinkProps {
    monitoring: string;
    dbName: string;
    dbType: string;
    clusterName?: string;
}

export type GetMonitoringLink = typeof getMonitoringLink;

export function getMonitoringLink({
    monitoring,
    dbName,
    dbType,
    clusterName,
}: GetMonitoringLinkProps) {
    const data = parseMonitoringData(monitoring);

    if (data) {
        const monitoringUrl = data.monitoring_url;

        const dashboard =
            dbType === ETenantType.Serverless
                ? data.serverless_dashboard
                : data.dedicated_dashboard;

        const host = data.host ?? 'cluster';
        const slot = data.slot ?? 'static';

        const finalClusterName = data.cluster_name || clusterName || '';

        const href = `${monitoringUrl}/${dashboard}?p.cluster=${finalClusterName}&p.host=${host}&p.slot=${slot}&p.database=${dbName}`;

        return encodeURI(href);
    }

    return '';
}

export type GetMonitoringClusterLink = typeof getMonitoringClusterLink;

export function getMonitoringClusterLink(monitoring: string, clusterName?: string) {
    const data = parseMonitoringData(monitoring);

    if (data) {
        const monitoringUrl = data.monitoring_url;
        const clusterDashboard = data.cluster_dashboard;

        const finalClusterName = data.cluster_name ?? clusterName;

        if (clusterDashboard && finalClusterName) {
            return `${monitoringUrl}/${clusterDashboard}/view?p.cluster=${finalClusterName}&p.database=-`;
        }
    }
    return '';
}

export function parseMonitoringData(monitoring: string): ParsedMonitoringData | undefined {
    try {
        const data = JSON.parse(monitoring);
        if (typeof data === 'object' && 'monitoring_url' in data) {
            return data;
        }
    } catch {}

    return undefined;
}
