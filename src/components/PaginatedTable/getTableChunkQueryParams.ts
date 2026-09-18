import type {PaginatedTableId} from './constants';
import {shouldSendColumnIds} from './constants';
import type {Column, FetchData, SortParams} from './types';

interface Params<T, F> {
    offset: number;
    limit: number;
    fetchData: FetchData<T, F>;
    filters: F | undefined;
    sortParams?: SortParams;
    columns: Column<T>[];
    tableName: PaginatedTableId;
    noBatching?: boolean;
}

export function getTableChunkQueryParams<T, F>({columns, tableName, ...params}: Params<T, F>) {
    return {
        ...params,
        fetchData: params.fetchData as FetchData<T, unknown>,
        tableName,
        columnsIds: shouldSendColumnIds(tableName)
            ? columns.map((column) => column.name).toSorted()
            : [],
    };
}
