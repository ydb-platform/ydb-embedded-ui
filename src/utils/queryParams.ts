const VOLATILE_QUERY_PARAMS = ['utm_referrer'] as const;

// These params represent a single UI state value, but legacy URLs can contain repeated or indexed
// copies of them. Canonicalize only this allowlist so intentional multi-value params stay intact.
const SINGLE_VALUE_QUERY_PARAMS = [
    'backend',
    'clusterName',
    'database',
    'schema',
    'databasePage',
    'tenantPage',
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
    'monitoringTab',
    'from',
    'to',
    'interval',
    'name',
    'selectedPartition',
    'activeOffset',
    'showPreview',
    'queryMode',
] as const;

type VolatileQueryParam = (typeof VOLATILE_QUERY_PARAMS)[number];
type QueryParamScalar = string | number | boolean;

function isQueryParamScalar(value: unknown): value is QueryParamScalar {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function getLastQueryParamScalar(value: unknown): QueryParamScalar | undefined {
    if (isQueryParamScalar(value)) {
        return value;
    }

    if (Array.isArray(value)) {
        for (let index = value.length - 1; index >= 0; index -= 1) {
            const scalar = getLastQueryParamScalar(value[index]);

            if (scalar !== undefined) {
                return scalar;
            }
        }

        return undefined;
    }

    if (value && typeof value === 'object') {
        const numericEntries = Object.entries(value)
            .filter(([key]) => /^\d+$/.test(key))
            .sort(([left], [right]) => Number(right) - Number(left));

        for (const [, nestedValue] of numericEntries) {
            const scalar = getLastQueryParamScalar(nestedValue);

            if (scalar !== undefined) {
                return scalar;
            }
        }
    }

    return undefined;
}

export function normalizeSingleValueQueryParams(query: Record<string, unknown>) {
    const result: Record<string, unknown> = {...query};

    SINGLE_VALUE_QUERY_PARAMS.forEach((param) => {
        if (!Object.prototype.hasOwnProperty.call(query, param)) {
            return;
        }

        const normalizedValue = getLastQueryParamScalar(query[param]);

        if (normalizedValue === undefined) {
            delete result[param];
        } else {
            result[param] = normalizedValue;
        }
    });

    return result;
}

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
