import React from 'react';

import {ObjectParam, useQueryParams} from 'use-query-params';

import type {KeyValueRow} from '../../../../../types/api/query';
import {getRunningQueryRowQueryParams} from '../utils/getRunningQueryRowQueryParams';

export interface RunningQuerySearchParams {
    queryHash?: string;
    sessionIdHash?: string;
    queryStart?: string;
}

export function useRunningQueriesRowSelection(rows?: KeyValueRow[] | null) {
    const [queryParams, setQueryParams] = useQueryParams({
        runningQuery: ObjectParam,
    });

    const searchParamsQuery: RunningQuerySearchParams = {
        queryHash: queryParams.runningQuery?.queryHash ?? undefined,
        sessionIdHash: queryParams.runningQuery?.sessionIdHash ?? undefined,
        queryStart: queryParams.runningQuery?.queryStart ?? undefined,
    };

    const findMatchedQueryRow = React.useCallback(() => {
        if (
            !rows ||
            !searchParamsQuery.queryHash ||
            !searchParamsQuery.sessionIdHash ||
            !searchParamsQuery.queryStart
        ) {
            return null;
        }

        return rows.find((row) => {
            const params = getRunningQueryRowQueryParams(row);
            return (
                params.queryHash === searchParamsQuery.queryHash &&
                params.sessionIdHash === searchParamsQuery.sessionIdHash &&
                params.queryStart === searchParamsQuery.queryStart
            );
        });
    }, [
        rows,
        searchParamsQuery.queryHash,
        searchParamsQuery.sessionIdHash,
        searchParamsQuery.queryStart,
    ]);

    const matchedRow = findMatchedQueryRow();

    const handleRowSelect = React.useCallback(
        (row: KeyValueRow | null) => {
            if (!row) {
                setQueryParams(
                    {
                        runningQuery: undefined,
                    },
                    'replaceIn',
                );
                return;
            }

            // Extract params using the utility function
            const params = getRunningQueryRowQueryParams(row);
            setQueryParams(
                {
                    runningQuery: {
                        queryHash: params.queryHash || undefined,
                        sessionIdHash: params.sessionIdHash || undefined,
                        queryStart: params.queryStart || undefined,
                    },
                },
                'replaceIn',
            );
        },
        [setQueryParams],
    );

    return {
        hasSearchParams:
            Boolean(searchParamsQuery.queryHash) &&
            Boolean(searchParamsQuery.sessionIdHash) &&
            Boolean(searchParamsQuery.queryStart),
        selectedRow: matchedRow || null,
        handleRowSelect,
    };
}
