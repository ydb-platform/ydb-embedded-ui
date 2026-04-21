const VOLATILE_QUERY_PARAMS = ['utm_referrer'] as const;

export function omitVolatileQueryParams<T extends Record<string, unknown>>(query: T): T {
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
