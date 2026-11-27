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

    // Leave the string as is when there is nothing to remove, and never rename other params
    // (parsing with `qs` would turn `search[]=a&search=b` into `search=a&search=b`)
    if (volatileParams.length === 0) {
        return search;
    }

    volatileParams.forEach((param) => params.delete(param));
    const result = params.toString();

    return result ? `?${result}` : '';
}

/** Location for a redirect to `pathname` that keeps the current query params and hash */
export function getRedirectLocation(location: {search: string; hash: string}, pathname: string) {
    return {
        pathname,
        search: omitVolatileQueryParamsFromSearch(location.search),
        hash: location.hash,
    };
}
