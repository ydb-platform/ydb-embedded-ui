import React from 'react';

import {StringParam, useQueryParams} from 'use-query-params';

export function useClustersQueryParams() {
    const [{search}, setQueryParams] = useQueryParams({
        search: StringParam,
    });

    const handleSearchChange = React.useCallback(
        (value: string) => {
            setQueryParams({search: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

    return {
        search: search || '',

        handleSearchChange,
    };
}
