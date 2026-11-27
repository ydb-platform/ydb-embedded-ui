import qs from 'qs';

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
    const query = omitVolatileQueryParams(qs.parse(search, {ignoreQueryPrefix: true}));

    return qs.stringify(query, {
        addQueryPrefix: true,
        arrayFormat: 'repeat',
        encoder: encodeURIComponent,
    });
}

/** Location for a redirect to `pathname` that keeps the current query params and hash */
export function getRedirectLocation(location: {search: string; hash: string}, pathname: string) {
    return {
        pathname,
        search: omitVolatileQueryParamsFromSearch(location.search),
        hash: location.hash,
    };
}
