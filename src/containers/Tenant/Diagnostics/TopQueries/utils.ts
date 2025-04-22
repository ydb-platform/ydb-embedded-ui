import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {prepareBackendSortFieldsFromTableSort, useTableSort} from '../../../../utils/hooks';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';

import {
    QUERIES_COLUMNS_IDS,
    getRunningQueriesColumnSortField,
    getTopQueriesColumnSortField,
} from './columns/constants';

export const TOP_QUERIES_TABLE_SETTINGS: Settings = {
    ...QUERY_TABLE_SETTINGS,
    disableSortReset: true,
    externalSort: true,
};

export function useTopQueriesSort() {
    const [tableSort, handleTableSort] = useTableSort({
        initialSortColumn: QUERIES_COLUMNS_IDS.CPUTime,
        initialSortOrder: DataTable.DESCENDING,
        multiple: true,
        fixedOrderType: DataTable.DESCENDING,
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

export function useRunningQueriesSort() {
    const [tableSort, handleTableSort] = useTableSort({
        initialSortColumn: QUERIES_COLUMNS_IDS.QueryStartAt,
        initialSortOrder: DataTable.DESCENDING,
        multiple: true,
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
