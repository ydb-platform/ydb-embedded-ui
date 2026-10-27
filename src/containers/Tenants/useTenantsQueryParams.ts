import React from 'react';

import {BooleanParam, StringParam, useQueryParams} from 'use-query-params';

import {useQueryParamsScope} from '../../utils/hooks/useQueryParamsScope';

export function useTenantsQueryParams() {
    const [{withProblems, search}, setQueryParams] = useQueryParams({
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

        handleWithProblemsChange,
        handleSearchChange,
    };
}

export function useTenantsSearchScope() {
    return useQueryParamsScope([
        'environment',
        'clusterName',
        'database',
        'schema',
        'path',
        'backend',
    ]);
}
