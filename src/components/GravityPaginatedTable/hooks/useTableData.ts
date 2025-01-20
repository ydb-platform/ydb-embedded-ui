import React from 'react';

import {useRowVirtualizer} from '@gravity-ui/table';
import type {SortingState} from '@gravity-ui/table/tanstack';

import {tableDataApi} from '../../../store/reducers/tableData';
import type {IResponseError} from '../../../types/api/error';
import type {FetchData} from '../../PaginatedTable/types';
import {ASCENDING, DEFAULT_VIRTUALIZATION_OVERSCAN, DESCENDING} from '../constants';
import type {SortParams, UseTableDataProps, UseTableDataResult} from '../types';

import {useChunkLoader} from './useChunkLoader';

const DEFAULT_CHUNK_SIZE = 50;
const TABLE_PADDINGS = 14;

interface UseTableDataPropsWithSorting<T, F> extends UseTableDataProps<T, F> {
    sorting?: SortingState;
}

function convertSortingToSortParams(sorting?: SortingState): SortParams | undefined {
    if (!sorting?.[0]) {
        return undefined;
    }
    return {
        columnId: sorting[0].id,
        sortOrder: sorting[0].desc ? DESCENDING : ASCENDING,
    };
}

export function useTableData<T, F>({
    fetchData,
    filters,
    tableName,
    columns,
    chunkSize = DEFAULT_CHUNK_SIZE,
    autoRefreshInterval,
    rowHeight,
    containerRef,
    sorting,
    initialEntitiesCount,
}: UseTableDataPropsWithSorting<T, F>): UseTableDataResult<T> {
    const [fetchTableChunk] = tableDataApi.useLazyFetchTableChunkQuery({
        pollingInterval: autoRefreshInterval,
    });

    const fetchChunkData = React.useCallback(
        async (offset: number) => {
            const sortParams = convertSortingToSortParams(sorting);
            console.log('Fetching with sort params:', sortParams, 'from sorting:', sorting);

            const queryParams = {
                fetchData: fetchData as FetchData<unknown, unknown>,
                filters,
                columnsIds: columns.map((col) => col.name),
                tableName,
                offset,
                limit: chunkSize,
                sortParams,
            };
            const result = await fetchTableChunk(queryParams).unwrap();
            return {
                data: result.data as T[],
                found: result.found,
                total: result.total,
            };
        },
        [fetchTableChunk, fetchData, filters, columns, tableName, chunkSize, sorting],
    );

    // Create virtualizer with found count
    const rowVirtualizer = useRowVirtualizer({
        count: foundCount,
        estimateSize: () => rowHeight + TABLE_PADDINGS,
        overscan: DEFAULT_VIRTUALIZATION_OVERSCAN,
        getScrollElement: () => containerRef.current,
        useScrollendEvent: true,
    });

    const startChunk = Math.floor((rowVirtualizer.range?.startIndex ?? 0) / chunkSize);
    const endChunk = Math.floor((rowVirtualizer.range?.endIndex ?? 0) / chunkSize);

    // Load data for visible chunks
    const {data, isLoading, error, totalCount, foundCount} = useChunkLoader<T>(
        startChunk,
        endChunk,
        chunkSize,
        fetchChunkData,
    );

    return {
        data,
        isLoading,
        error: error as IResponseError | undefined,
        totalEntities: totalCount,
        foundEntities: foundCount,
        rowVirtualizer,
    };
}
