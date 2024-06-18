import type {ETenantType} from '../types/api/tenant';

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
    dbType: ETenantType;
    clusterName?: string;
}

export type GetMonitoringLink = typeof getMonitoringLink;

export function getMonitoringLink({
    monitoring,
    dbName,
    dbType,
    clusterName,
}: GetMonitoringLinkProps) {
    try {
        const data = parseMonitoringData(monitoring);

        if (data) {
            const host = data.host ?? 'cluster';
            const slot = data.slot ?? 'static';

            const finalClusterName = data.cluster_name || clusterName || '';

            const url = new URL(data.monitoring_url);

            if (!url.search) {
                const dashboard =
                    dbType === 'Serverless' ? data.serverless_dashboard : data.dedicated_dashboard;

                url.pathname += `/${dashboard}`;
            }

            if (!url.searchParams.has('p.cluster')) {
                url.searchParams.set('p.cluster', finalClusterName);
            }
            url.searchParams.set('p.host', host);
            url.searchParams.set('p.slot', slot);
            url.searchParams.set('p.database', dbName);

            return url.toString();
        }
    } catch {}

    return '';
}

export type GetMonitoringClusterLink = typeof getMonitoringClusterLink;

export function getMonitoringClusterLink(monitoring: string, clusterName?: string) {
    try {
        const data = parseMonitoringData(monitoring);

        if (data) {
            const clusterDashboard = data.cluster_dashboard;
            const finalClusterName = data.cluster_name || clusterName || '';

            const url = new URL(data.monitoring_url);

            if (!url.search && clusterDashboard) {
                url.pathname += `/${clusterDashboard}/view`;
            }

            if (!url.searchParams.has('p.cluster')) {
                url.searchParams.set('p.cluster', finalClusterName);
            }

            url.searchParams.set('p.database', '-');

            return url.toString();
        }
    } catch {}

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
