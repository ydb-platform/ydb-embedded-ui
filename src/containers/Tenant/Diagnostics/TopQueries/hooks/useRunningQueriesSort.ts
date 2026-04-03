import React from 'react';

import type {SortOrder} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {z} from 'zod';

import {prepareBackendSortFieldsFromTableSort, useTableSort} from '../../../../../utils/hooks';
import {QUERIES_COLUMNS_IDS, getRunningQueriesColumnSortField} from '../columns/constants';

import {useSortParam} from './useSortParam';

export const runningQueriesSortColumnSchema = z
    .enum([
        QUERIES_COLUMNS_IDS.QueryStartAt,
        QUERIES_COLUMNS_IDS.UserSID,
        QUERIES_COLUMNS_IDS.ApplicationName,
    ])
    .catch(QUERIES_COLUMNS_IDS.QueryStartAt);

export const DEFAULT_RUNNING_QUERIES_SORT: SortOrder = {
    columnId: QUERIES_COLUMNS_IDS.QueryStartAt,
    order: DataTable.DESCENDING,
};

export function useRunningQueriesSort() {
    const {sortParam, updateSortParam} = useSortParam({
        paramName: 'runningSort',
        schema: runningQueriesSortColumnSchema,
        defaultSort: DEFAULT_RUNNING_QUERIES_SORT,
    });

    const [tableSort, handleTableSort] = useTableSort({
        initialSortColumn: sortParam?.[0]?.columnId || DEFAULT_RUNNING_QUERIES_SORT.columnId,
        initialSortOrder: sortParam?.[0]?.order || DEFAULT_RUNNING_QUERIES_SORT.order,
        multiple: true,
        onSort: updateSortParam,
    });

    return {
        tableSort,
        handleTableSort,
        backendSort: React.useMemo(
            () =>
                prepareBackendSortFieldsFromTableSort(tableSort, getRunningQueriesColumnSortField),
            [tableSort],
        ),
    };
}
