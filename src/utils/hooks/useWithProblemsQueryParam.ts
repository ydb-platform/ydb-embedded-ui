import React from 'react';

import {BooleanParam, useQueryParams} from 'use-query-params';

export function useWithProblemsQueryParam() {
    const [{withProblems}, setQueryParams] = useQueryParams({
        withProblems: BooleanParam,
    });

    const handleWithProblemsChange = React.useCallback(
        (value: boolean) => {
            setQueryParams({withProblems: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

    return {
        withProblems: Boolean(withProblems),
        handleWithProblemsChange,
    };
}
