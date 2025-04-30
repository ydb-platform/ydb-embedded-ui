import React from 'react';

import type {SortOrder} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {z} from 'zod';

import {prepareBackendSortFieldsFromTableSort, useTableSort} from '../../../../../utils/hooks';
import {QUERIES_COLUMNS_IDS, getTopQueriesColumnSortField} from '../columns/constants';

import {useSortParam} from './useSortParam';

export const topQueriesSortColumnSchema = z
    .enum([
        QUERIES_COLUMNS_IDS.CPUTime,
        QUERIES_COLUMNS_IDS.Duration,
        QUERIES_COLUMNS_IDS.ReadRows,
        QUERIES_COLUMNS_IDS.ReadBytes,
        QUERIES_COLUMNS_IDS.QueryText,
    ])
    .catch(QUERIES_COLUMNS_IDS.CPUTime);

export const DEFAULT_TOP_QUERIES_SORT: SortOrder = {
    columnId: QUERIES_COLUMNS_IDS.CPUTime,
    order: DataTable.DESCENDING,
};

export function useTopQueriesSort() {
    const {sortParam, updateSortParam} = useSortParam({
        paramName: 'topSort',
        schema: topQueriesSortColumnSchema,
        defaultSort: DEFAULT_TOP_QUERIES_SORT,
    });

    const [tableSort, handleTableSort] = useTableSort({
        initialSortColumn: sortParam?.[0]?.columnId || DEFAULT_TOP_QUERIES_SORT.columnId,
        initialSortOrder: sortParam?.[0]?.order || DEFAULT_TOP_QUERIES_SORT.order,
        multiple: true,
        fixedOrderType: DataTable.DESCENDING,
        onSort: updateSortParam,
    });

    return {
        tableSort,
        handleTableSort,
        backendSort: React.useMemo(
            () => prepareBackendSortFieldsFromTableSort(tableSort, getTopQueriesColumnSortField),
            [tableSort],
        ),
    };
}
