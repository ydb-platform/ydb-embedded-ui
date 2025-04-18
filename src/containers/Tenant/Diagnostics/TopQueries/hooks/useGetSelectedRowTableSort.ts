import type {SortOrder} from '@gravity-ui/react-data-table';
import {StringParam, useQueryParams} from 'use-query-params';

export function useGetSelectedRowTableSort(): SortOrder[] | undefined {
    const [queryParams] = useQueryParams({
        selectedRow: StringParam,
    });
    const searchParamsQuery: {tableSort?: SortOrder[]} = queryParams.selectedRow
        ? JSON.parse(decodeURIComponent(queryParams.selectedRow))
        : {};

    return searchParamsQuery.tableSort;
}
