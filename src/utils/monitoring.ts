import type {ETenantType} from '../types/api/tenant';

type ParsedMonitoringData = {
    monitoring_url: string;

    serverless_dashboard?: string;
    dedicated_dashboard?: string;
    cluster_dashboard?: string;

    host?: string;
    slot?: string;

    cluster_name?: string;
};

interface GetMonitoringLinkProps {
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

interface GetLogsLinkProps {
    dbName: string;
    clusterName?: string;
    monitoring: string;
    project?: string;
    service?: string;
    level?: string;
    from?: string;
    to?: string;
    columns?: string[];
    groupByField?: string;
    chartType?: string;
    linesMode?: string;
}

export type GetLogsLink = typeof getLogsLink;

export function getLogsLink({
    dbName,
    clusterName,
    monitoring,
    project = 'kikimr',
    service = 'ydb',
    level = 'ERROR',
    from = 'now-1h',
    to = 'now',
    columns = ['level', 'time', 'message', 'host'],
    groupByField = 'level',
    chartType = 'line',
    linesMode = 'single',
}: GetLogsLinkProps): string {
    try {
        const data = parseMonitoringData(monitoring);

        if (data) {
            const finalClusterName = data.cluster_name || clusterName || '';

            const url = new URL(data.monitoring_url);

            url.pathname += '/_______/';

            const queryFilter = {
                project,
                service,
                cluster: finalClusterName,
                database: dbName,
                level,
            };

            url.searchParams.set('from', from);
            url.searchParams.set('to', to);

            const queryString = Object.entries(queryFilter)
                .map(([key, value]) => `${key} = "${value}"`)
                .join(', ');
            url.searchParams.set('query', `{${queryString}}`);

            url.searchParams.set('columns', columns.join(','));

            if (groupByField) {
                url.searchParams.set('groupByField', groupByField);
            }

            if (chartType) {
                url.searchParams.set('chartType', chartType);
            }

            if (linesMode) {
                url.searchParams.set('linesMode', linesMode);
            }

            return url.toString();
        }
    } catch {}

    return '';
}
