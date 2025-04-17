import React from 'react';

import {ObjectParam, useQueryParams} from 'use-query-params';

import type {KeyValueRow} from '../../../../../types/api/query';
import {getTopQueryRowQueryParams} from '../utils/getTopQueryRowQueryParams';

export interface SearchParamsQueryParams {
    rank?: string;
    intervalEnd?: string;
    endTime?: string;
    queryHash?: string;
}

export function useTopQueriesRowSelection(rows?: KeyValueRow[] | null) {
    const [queryParams, setQueryParams] = useQueryParams({
        topQuery: ObjectParam,
    });

    const searchParamsQuery: SearchParamsQueryParams = {
        rank: queryParams.topQuery?.rank ?? undefined,
        intervalEnd: queryParams.topQuery?.intervalEnd ?? undefined,
        endTime: queryParams.topQuery?.endTime ?? undefined,
        queryHash: queryParams.topQuery?.queryHash ?? undefined,
    };

    const findMatchedQueryRow = React.useCallback(() => {
        if (
            !rows ||
            !searchParamsQuery.rank ||
            !searchParamsQuery.intervalEnd ||
            !searchParamsQuery.endTime
        ) {
            return null;
        }

        return rows.find((row) => {
            const params = getTopQueryRowQueryParams(row);
            return (
                params.rank === searchParamsQuery.rank &&
                params.intervalEnd === searchParamsQuery.intervalEnd &&
                params.endTime === searchParamsQuery.endTime &&
                searchParamsQuery.queryHash === params.queryHash
            );
        });
    }, [
        rows,
        searchParamsQuery.rank,
        searchParamsQuery.intervalEnd,
        searchParamsQuery.endTime,
        searchParamsQuery.queryHash,
    ]);

    const matchedRow = findMatchedQueryRow();

    const handleRowSelect = React.useCallback(
        (
            row: KeyValueRow | null,
            _index?: number,
            event?: React.MouseEvent<HTMLTableRowElement>,
        ) => {
            event?.stopPropagation();

            if (!row) {
                setQueryParams(
                    {
                        topQuery: undefined,
                    },
                    'replaceIn',
                );
                return;
            }

            const params = getTopQueryRowQueryParams(row);
            setQueryParams(
                {
                    topQuery: {
                        rank: params.rank || undefined,
                        intervalEnd: params.intervalEnd || undefined,
                        endTime: params.endTime || undefined,
                        queryHash: params.queryHash || undefined,
                    },
                },
                'replaceIn',
            );
        },
        [setQueryParams],
    );

    return {
        hasSearchParams:
            Boolean(searchParamsQuery.rank) &&
            Boolean(searchParamsQuery.intervalEnd) &&
            Boolean(searchParamsQuery.endTime) &&
            Boolean(searchParamsQuery.queryHash),
        selectedRow: matchedRow || null,
        handleRowSelect,
    };
}
