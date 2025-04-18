import React from 'react';

import {StringParam, useQueryParams} from 'use-query-params';

import type {KeyValueRow} from '../../../../../types/api/query';
import {getTopQueryRowQueryParams} from '../utils/getTopQueryRowQueryParams';

export interface SearchParamsQueryParams {
    rank?: string;
    intervalEnd?: string;
    endTime?: string;
    queryHash?: string;
}

export function useSetSelectedTopQueryRowFromParams(
    setSelectedRow: (row: KeyValueRow | null) => void,
    rows?: KeyValueRow[] | null,
) {
    const [queryParams, setQueryParams] = useQueryParams({
        selectedRow: StringParam,
    });

    // Handle initialization from URL params
    React.useEffect(() => {
        if (rows && queryParams.selectedRow) {
            const searchParamsQuery: SearchParamsQueryParams = JSON.parse(
                decodeURIComponent(queryParams.selectedRow),
            );
            const matchedRow = rows.find((row) => {
                const params = getTopQueryRowQueryParams(row);
                return (
                    params.rank === searchParamsQuery.rank &&
                    params.intervalEnd === searchParamsQuery.intervalEnd &&
                    params.endTime === searchParamsQuery.endTime &&
                    searchParamsQuery.queryHash === params.queryHash
                );
            });

            if (matchedRow) {
                setSelectedRow(matchedRow);
            } else {
                // If we had a selectedRow in URL but couldn't find a matching row,
                // explicitly set selectedRow to null to indicate empty state
                setSelectedRow(null);
            }

            // Clear URL params after using them
            setQueryParams({selectedRow: undefined});
        }
    }, [queryParams.selectedRow, setQueryParams, rows, setSelectedRow]);

    return null;
}
