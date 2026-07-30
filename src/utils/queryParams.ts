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
    // Monitoring dashboard parameters declared by embedding applications
    'monitoringTab',
    'from',
    'to',
    'interval',
]);

function getQueryParamBaseName(name: string) {
    const bracketIndex = name.indexOf('[');
    return bracketIndex === -1 ? name : name.slice(0, bracketIndex);
}

function isValidSelectedRow(value: string) {
    try {
        const parsed: unknown = JSON.parse(decodeURIComponent(value));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return false;
        }

        const selectedRow = parsed as Record<string, unknown>;
        return ['rank', 'intervalEnd', 'endTime', 'queryHash'].every(
            (name) => selectedRow[name] === undefined || typeof selectedRow[name] === 'string',
        );
    } catch {
        return false;
    }
}

function isValidDatabaseScalarValue(name: string, value: string) {
    return name !== 'selectedRow' || isValidSelectedRow(value);
}

export function isDatabasePathname(pathname?: string) {
    return Boolean(pathname?.replace(/\/+$/, '').endsWith('/database'));
}

/**
 * Canonicalizes a `/database` query string: drops volatile parameters, collapses
 * repeated or indexed (`param[0]`) occurrences of known single-value parameters to
 * their last valid value, and preserves unknown (potentially multi-valued) parameters
 * unchanged. Applying it repeatedly does not change the result.
 */
export function canonicalizeDatabaseQueryString(search: string) {
    const hasQueryPrefix = search.startsWith('?');
    const entries = Array.from(new URLSearchParams(search).entries());
    const lastIndexes = new Map<string, number>();

    entries.forEach(([name, value], index) => {
        const baseName = getQueryParamBaseName(name);
        if (VOLATILE_QUERY_PARAM_SET.has(baseName)) {
            return;
        }
        if (
            DATABASE_SINGLE_VALUE_PARAMS.has(baseName) &&
            isValidDatabaseScalarValue(baseName, value)
        ) {
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

export function canonicalizeCurrentDatabaseUrl() {
    if (!isDatabasePathname(window.location.pathname)) {
        return;
    }

    const canonicalSearch = canonicalizeDatabaseQueryString(window.location.search);
    if (canonicalSearch === window.location.search) {
        return;
    }

    window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${canonicalSearch}${window.location.hash}`,
    );
}
