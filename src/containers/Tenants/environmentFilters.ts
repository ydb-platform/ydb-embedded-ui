import type {QueryParamConfig} from 'use-query-params';
import {ArrayParam} from 'use-query-params';

const filterValuesParam: QueryParamConfig<string[]> = {
    encode: (values) => ArrayParam.encode(values.length ? values : undefined),
    decode(input) {
        return Array.from(
            new Set(ArrayParam.decode(input)?.filter((value): value is string => Boolean(value))),
        );
    },
};

/** Filters by entities of one environment: they make no sense in another one. */
export const ENVIRONMENT_FILTERS_PARAMS = {
    cluster: filterValuesParam,
    cloudId: filterValuesParam,
};
