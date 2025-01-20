import React from 'react';

import {useRowVirtualizer} from '@gravity-ui/table';
import type {SortingState} from '@gravity-ui/table/tanstack';
import {throttle} from 'lodash';

import {tableDataApi} from '../../../store/reducers/tableData';
import type {IResponseError} from '../../../types/api/error';
import type {FetchData} from '../../PaginatedTable/types';
import {
    ASCENDING,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_INITIAL_ENTITIES,
    DEFAULT_VIRTUALIZATION_OVERSCAN,
    DESCENDING,
    TABLE_PADDINGS,
} from '../constants';
import type {SortParams, UseTableDataProps, UseTableDataResult} from '../types';

import {useChunkLoader} from './useChunkLoader';

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

const THROTTLE_DELAY = 200;

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
    initialEntitiesCount = DEFAULT_INITIAL_ENTITIES,
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

    // Load data for visible chunks
    const {data, isLoading, error, totalCount, foundCount, onRangeChange} = useChunkLoader<T>(
        chunkSize,
        fetchChunkData,
        {initialEntitiesCount},
    );

    const foundEntities = foundCount ?? initialEntitiesCount;

    // Create throttled onRangeChange
    const throttledOnRangeChange = React.useMemo(
        () =>
            throttle(onRangeChange, THROTTLE_DELAY, {
                leading: true,
                trailing: true,
            }),
        [onRangeChange],
    );

    // Cleanup throttle on unmount
    React.useEffect(() => {
        return () => {
            throttledOnRangeChange.cancel();
        };
    }, [throttledOnRangeChange]);

    // Create virtualizer with effective count
    const rowVirtualizer = useRowVirtualizer({
        count: foundEntities,
        estimateSize: () => rowHeight + TABLE_PADDINGS,
        overscan: DEFAULT_VIRTUALIZATION_OVERSCAN,
        getScrollElement: () => containerRef.current,
        useScrollendEvent: true,
        onChange: throttledOnRangeChange,
    });

    return {
        data,
        isLoading,
        error: error as IResponseError | undefined,
        totalEntities: totalCount,
        foundEntities,
        rowVirtualizer,
    };
}
