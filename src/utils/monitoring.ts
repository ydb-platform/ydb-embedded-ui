import {ETenantType} from '../types/api/tenant';

export type ParsedMonitoringData = {
    monitoring_url: string;
    serverless_dashboard: string;
    dedicated_dashboard: string;

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

const isMonitoring = (link: string) => {
    return link.startsWith('https://monitoring');
};

export type GetMonitoringLink = typeof getMonitoringLink;

export function getMonitoringLink({
    monitoring,
    dbName,
    dbType,
    clusterName,
}: GetMonitoringLinkProps) {
    const data = parseMonitoringData(monitoring);
    let href = '';
    if (data) {
        const monitoringUrl = data.monitoring_url;

        const dashboard =
            dbType === ETenantType.Serverless
                ? data.serverless_dashboard
                : data.dedicated_dashboard;

        const host = data.host ?? 'cluster';
        const slot = data.slot ?? 'static';

        const finalClusterName = data.cluster_name || clusterName || '';

        if (isMonitoring(monitoringUrl)) {
            href = `${monitoringUrl}/${dashboard}?p.cluster=${finalClusterName}&p.host=${host}&p.slot=${slot}&p.database=${dbName}`;
        } else {
            href = `${monitoringUrl}&host=${host}&slot=${slot}&database=${dbName}&dashboard=${dashboard}`;
        }
        href = encodeURI(href);
    }

    return href;
}

export type GetMonitoringClusterLink = typeof getMonitoringClusterLink;

export function getMonitoringClusterLink(monitoring: string) {
    const data = parseMonitoringData(monitoring);
    if (data) {
        return data.monitoring_url;
    }
    return '';
}

export function parseMonitoringData(monitoring: string): ParsedMonitoringData | undefined {
    try {
        const data = JSON.parse(monitoring);
        if (typeof data === 'object' && 'monitoring_url' in data) {
            return data;
        }
    } catch (error) {
        console.log(error);
    }

    return undefined;
}
