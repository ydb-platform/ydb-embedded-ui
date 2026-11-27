const VOLATILE_QUERY_PARAMS = ['utm_referrer'] as const;

type VolatileQueryParam = (typeof VOLATILE_QUERY_PARAMS)[number];

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

export function omitVolatileQueryParamsFromSearch(search: string) {
    const params = new URLSearchParams(search);
    const volatileParams = VOLATILE_QUERY_PARAMS.filter((param) => params.has(param));

    if (volatileParams.length === 0) {
        return search;
    }

    volatileParams.forEach((param) => params.delete(param));
    const result = params.toString();

    return result ? `?${result}` : '';
}
