import React from 'react';

import type {SortOrder} from '@gravity-ui/react-data-table';
import {JsonParam, useQueryParam} from 'use-query-params';
import type {z} from 'zod';

export function useSortParam(options: {
    paramName: string;
    schema: z.ZodType<string, any, any>;
    defaultSort: SortOrder;
}) {
    const {paramName, schema, defaultSort} = options;
    const [urlSortParam, setUrlSortParam] = useQueryParam<SortOrder[]>(paramName, JsonParam);

    const parsedUrlSort = React.useMemo(() => {
        if (!urlSortParam?.length) {
            return [defaultSort];
        }

        const validSortParams = urlSortParam.filter((sort) => {
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
            setUrlSortParam(sortOrder || [], 'replaceIn');
        },
        [setUrlSortParam],
    );

    return {
        sortParam: parsedUrlSort,
        updateSortParam,
    };
}
