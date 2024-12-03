import React from 'react';

import {prepareBackendSortFieldsFromTableSort, useTableSort} from '../../../../utils/hooks';

import {TOP_SHARDS_COLUMNS_IDS, getTopShardsColumnSortField} from './columns/constants';

export function useTopShardSort() {
    const [tableSort, handleTableSort] = useTableSort({
        initialSortColumn: TOP_SHARDS_COLUMNS_IDS.CPUCores,
        fixedOrderType: -1,
        multiple: true,
    });

    const backendSort = React.useMemo(
        () => prepareBackendSortFieldsFromTableSort(tableSort, getTopShardsColumnSortField),
        [tableSort],
    );

    return {
        tableSort,
        handleTableSort,
        backendSort,
    };
}
