const VOLATILE_QUERY_PARAMS = ['utm_referrer'] as const;

type VolatileQueryParam = (typeof VOLATILE_QUERY_PARAMS)[number];

const VOLATILE_QUERY_PARAM_SET: ReadonlySet<string> = new Set(VOLATILE_QUERY_PARAMS);

export function omitVolatileQueryParams<T extends Record<string, unknown>>(
    query: T,
): Omit<T, VolatileQueryParam> {
    let result = query;

    VOLATILE_QUERY_PARAMS.forEach((param) => {
        if (Object.prototype.hasOwnProperty.call(result, param)) {
            if (result === query) {
                result = {...query};
            }

            delete result[param];
        }
    });

    return result;
}

/**
 * Known single-value query parameters of the `/database` route.
 * Repeated or indexed (`param[0]`) occurrences of these are collapsed to the last value
 * by `canonicalizeDatabaseQueryString`. Parameters not listed here are treated as
 * potentially multi-valued and are preserved as-is.
 */
const DATABASE_SINGLE_VALUE_PARAMS: ReadonlySet<string> = new Set([
    'backend',
    'clusterName',
    'database',
    'databasePage',
    'tenantPage',
    'schema',
    'name',
    'sort',
    'heatmap',
    'currentMetric',
    'queryTab',
    'diagnosticsTab',
    'summaryTab',
    'metricsTab',
    'shardsMode',
    'shardsDateFrom',
    'shardsDateTo',
    'topQueriesDateFrom',
    'topQueriesDateTo',
    'selectedConsumer',
    'showHealthcheck',
    'view',
    'issuesFilter',
    'showGrantAccess',
    'aclSubject',
    'queryMode',
    'timeFrame',
    'selectedRow',
    'selectedPartition',
    'selectedOffset',
    'startTimestamp',
    'topicDataFilter',
    'activeOffset',
    'withProblems',
    'topSort',
    'runningSort',
    'showPreview',
]);

function getQueryParamBaseName(name: string) {
    const bracketIndex = name.indexOf('[');
    return bracketIndex === -1 ? name : name.slice(0, bracketIndex);
}

/**
 * Canonicalizes a `/database` query string: drops volatile parameters, collapses
 * repeated or indexed (`param[0]`) occurrences of known single-value parameters
 * to their last value, and preserves unknown (potentially multi-valued) parameters
 * unchanged. Applying it repeatedly does not change the result.
 */
export function canonicalizeDatabaseQueryString(search: string) {
    const hasQueryPrefix = search.startsWith('?');
    const entries = Array.from(new URLSearchParams(search).entries());
    const lastIndexes = new Map<string, number>();

    entries.forEach(([name], index) => {
        const baseName = getQueryParamBaseName(name);
        if (VOLATILE_QUERY_PARAM_SET.has(baseName)) {
            return;
        }
        if (DATABASE_SINGLE_VALUE_PARAMS.has(baseName)) {
            lastIndexes.set(baseName, index);
        }
    });

    const canonicalParams = new URLSearchParams();
    entries.forEach(([name, value], index) => {
        const baseName = getQueryParamBaseName(name);
        if (VOLATILE_QUERY_PARAM_SET.has(baseName)) {
            return;
        }
        if (!DATABASE_SINGLE_VALUE_PARAMS.has(baseName)) {
            canonicalParams.append(name, value);
        } else if (lastIndexes.get(baseName) === index) {
            canonicalParams.append(baseName, value);
        }
    });

    const canonicalSearch = canonicalParams.toString();
    return hasQueryPrefix && canonicalSearch ? `?${canonicalSearch}` : canonicalSearch;
}
