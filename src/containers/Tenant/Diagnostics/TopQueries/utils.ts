import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';

import {prepareBackendSortFieldsFromTableSort, useTableSort} from '../../../../utils/hooks';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';

import {TOP_QUERIES_COLUMNS_IDS, getTopQueriesColumnSortField} from './columns/constants';

export const TOP_QUERIES_TABLE_SETTINGS: Settings = {
    ...QUERY_TABLE_SETTINGS,
    disableSortReset: true,
};

function useQueriesSort(initialSortColumn: string) {
    const [tableSort, handleTableSort] = useTableSort({
        initialSortColumn: initialSortColumn,
        initialSortOrder: -1,
        multiple: true,
        fixedOrderType: -1,
    });

    const backendSort = React.useMemo(
        () => prepareBackendSortFieldsFromTableSort(tableSort, getTopQueriesColumnSortField),
        [tableSort],
    );

    return {
        tableSort,
        handleTableSort,
        backendSort,
    };
}
export function useTopQueriesSort() {
    return useQueriesSort(TOP_QUERIES_COLUMNS_IDS.CPUTime);
}
export function useRunningQueriesSort() {
    return useQueriesSort(TOP_QUERIES_COLUMNS_IDS.QueryStartAt);
}
