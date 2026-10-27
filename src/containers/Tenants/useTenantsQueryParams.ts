import React from 'react';

import {BooleanParam, StringParam, useQueryParams} from 'use-query-params';

export const tenantsQueryParams = {
    withProblems: BooleanParam,
    search: StringParam,
};

export function useTenantsQueryParams() {
    const [{withProblems, search}, setQueryParams] = useQueryParams(tenantsQueryParams);

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
