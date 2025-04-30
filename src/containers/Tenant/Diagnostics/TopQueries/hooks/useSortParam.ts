import React from 'react';

import type {SortOrder} from '@gravity-ui/react-data-table';
import type {QueryParamConfig} from 'use-query-params';
import {useQueryParam} from 'use-query-params';
import type {z} from 'zod';

const SortOrderParam: QueryParamConfig<SortOrder[]> = {
    encode: (value) => {
        if (value === undefined || value === null || !Array.isArray(value)) {
            return undefined;
        }

        return encodeURIComponent(JSON.stringify(value));
    },
    decode: (value) => {
        if (typeof value !== 'string' || !value) {
            return [];
        }
        try {
            return JSON.parse(decodeURIComponent(value));
        } catch {
            return [];
        }
    },
};

export function useSortParam(options: {
    paramName: string;
    schema: z.ZodType<string, any, any>;
    defaultSort: SortOrder;
}) {
    const {paramName, schema, defaultSort} = options;
    const [urlSortParam, setUrlSortParam] = useQueryParam<SortOrder[]>(paramName, SortOrderParam);

    const parsedUrlSort = React.useMemo(() => {
        if (!urlSortParam || !Array.isArray(urlSortParam) || urlSortParam.length === 0) {
            return [defaultSort];
        }

        const validSortParams = urlSortParam.filter((sort: SortOrder) => {
            try {
                schema.parse(sort.columnId);
                return true;
            } catch {
                return false;
            }
        });

        return validSortParams.length ? validSortParams : [defaultSort];
    }, [urlSortParam, schema, defaultSort]);

    const updateSortParam = React.useCallback(
        (sortOrder?: SortOrder[]) => {
            // Using 'replace' instead of 'replaceIn' to ensure a full URL update
            // This helps prevent issues with partial URL parameter updates
            setUrlSortParam(sortOrder || [], 'replaceIn');
        },
        [setUrlSortParam],
    );

    return {
        sortParam: parsedUrlSort,
        updateSortParam,
    };
}
