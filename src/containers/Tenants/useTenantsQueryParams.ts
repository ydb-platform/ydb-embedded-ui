import React from 'react';

import type {QueryParamConfig} from 'use-query-params';
import {
    ArrayParam,
    BooleanParam,
    StringParam,
    createEnumParam,
    useQueryParams,
} from 'use-query-params';

import {MY_DATABASE_TYPES} from './constants';

const databaseTypeParam = createEnumParam<string>(MY_DATABASE_TYPES);

const filterValuesParam: QueryParamConfig<string[]> = {
    encode: (values) => ArrayParam.encode(values.length ? values : undefined),
    decode(input) {
        return Array.from(
            new Set(ArrayParam.decode(input)?.filter((value): value is string => Boolean(value))),
        );
    },
};

export function useTenantsQueryParams() {
    const [{withProblems, search, databaseType, cluster, cloudId, groupBy}, setQueryParams] =
        useQueryParams({
            databaseType: databaseTypeParam,
            cluster: filterValuesParam,
            cloudId: filterValuesParam,
            groupBy: StringParam,
            withProblems: BooleanParam,
            search: StringParam,
        });

    const handleWithProblemsChange = React.useCallback(
        (value: boolean) => {
            setQueryParams({withProblems: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );
    const handleSearchChange = React.useCallback(
        (value: string) => {
            setQueryParams({search: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

    return {
        withProblems: Boolean(withProblems),
        search: search || '',

        databaseType,
        setDatabaseType: (value?: string) => setQueryParams({databaseType: value}, 'replaceIn'),
        clusters: cluster,
        cloudIds: cloudId,
        groupBy,
        setClusters: (values: string[]) => setQueryParams({cluster: values}, 'replaceIn'),
        setCloudIds: (values: string[]) => setQueryParams({cloudId: values}, 'replaceIn'),
        setGroupBy: (value?: string) => setQueryParams({groupBy: value}, 'replaceIn'),
        handleWithProblemsChange,
        handleSearchChange,
    };
}
