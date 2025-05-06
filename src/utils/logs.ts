const DEFAULT_PROJECT = 'kikimr';
const DEFAULT_SERVICE = 'ydb';
const DEFAULT_TIME_RANGE = {
    from: 'now-1d',
    to: 'now',
};
const DEFAULT_COLUMNS = 'level,time,message,host';
const DEFAULT_GROUP_BY = 'level';
const DEFAULT_CHART_TYPE = 'line';
const DEFAULT_LINES_MODE = 'single';

interface GetLogsLinkProps {
    dbName: string;
    logging: string;
}

export type GetLogsLink = (props: GetLogsLinkProps) => string;

interface ParsedLogging {
    url: string;
    monium_cluster?: string;
}

function getBaseUrl(urlString: string): string {
    const url = new URL(urlString);
    return `${url.protocol}//${url.hostname}`;
}

export function getLogsLink({dbName, logging}: GetLogsLinkProps): string {
    try {
        const data = JSON.parse(logging) as ParsedLogging;

        if (typeof data === 'object' && 'url' in data) {
            const logUrl = data.url;
            if (!logUrl) {
                return '';
            }

            if (data.monium_cluster) {
                const baseUrl = getBaseUrl(logUrl);
                const url = new URL(`${baseUrl}/projects/${DEFAULT_PROJECT}/logs`);

                const query = `{project = "${DEFAULT_PROJECT}", service = "${DEFAULT_SERVICE}", cluster = "${data.monium_cluster}", database = "${dbName}"}`;

                url.searchParams.set('query', query);
                url.searchParams.set('from', DEFAULT_TIME_RANGE.from);
                url.searchParams.set('to', DEFAULT_TIME_RANGE.to);
                url.searchParams.set('columns', DEFAULT_COLUMNS);
                url.searchParams.set('groupByField', DEFAULT_GROUP_BY);
                url.searchParams.set('chartType', DEFAULT_CHART_TYPE);
                url.searchParams.set('linesMode', DEFAULT_LINES_MODE);

                // debug-only
                console.log('Monium_cluster branch');
                return url.toString();
            }

            const url = new URL(logUrl);

            const queryParam = url.searchParams.get('query');
            if (queryParam) {
                const decodedQuery = decodeURIComponent(queryParam);

                const queryBetweenBraces = decodedQuery.slice(1, -1);
                const witComma = queryBetweenBraces.length > 0;
                const updatedQuery = `{${queryBetweenBraces}${witComma ? ', ' : ''}database = "${dbName}"}`;

                url.searchParams.set('query', updatedQuery);
            }

            // debug-only
            console.log('Url parsing branch');
            return url.toString();
        }
    } catch {}

    return '';
}
