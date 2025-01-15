import React from 'react';

import {useRowVirtualizer} from '@gravity-ui/table';

import {tableDataApi} from '../../store/reducers/tableData';
import type {IResponseError} from '../../types/api/error';
import type {FetchData} from '../PaginatedTable/types';

import {tableReducer} from './tableReducer';
import type {UseTableDataProps, UseTableDataResult} from './types';

const DEFAULT_CHUNK_SIZE = 50;
const OVERSCAN_COUNT = 5;

function getQueryParams<T, F>(params: {
    fetchData: FetchData<T, F>;
    filters: F | undefined;
    columns: Array<{name: string}>;
    tableName: string;
    startIndex: number;
    chunkSize: number;
}) {
    const {fetchData, filters, columns, tableName, startIndex, chunkSize} = params;
    return {
        fetchData: fetchData as FetchData<unknown, unknown>,
        filters,
        columnsIds: columns.map((col) => col.name),
        tableName,
        offset: startIndex - (startIndex % chunkSize),
        limit: chunkSize,
    };
}

export function useTableData<T, F>({
    fetchData,
    filters,
    tableName,
    columns,
    chunkSize = DEFAULT_CHUNK_SIZE,
    autoRefreshInterval,
    initialEntitiesCount = 0,
    rowHeight,
    containerRef,
    overscanCount = OVERSCAN_COUNT,
}: UseTableDataProps<T, F>): UseTableDataResult<T> {
    const [state, dispatch] = React.useReducer(tableReducer<T>, {
        rows: [],
        foundEntities: initialEntitiesCount || 0,
        totalEntities: initialEntitiesCount || 0,
    });

    const rowVirtualizer = useRowVirtualizer({
        count: state.foundEntities,
        estimateSize: () => rowHeight,
        overscan: overscanCount,
        getScrollElement: () => containerRef.current,
    });

    const [fetchTableChunk, {error, isFetching}] = tableDataApi.useLazyFetchTableChunkQuery({
        pollingInterval: autoRefreshInterval,
    });

    const fetchChunkData = React.useCallback(async () => {
        const startIndex = rowVirtualizer.range?.startIndex ?? 0;
        const queryParams = getQueryParams({
            fetchData,
            filters: filters as F, // Type assertion since we know the filter type from props
            columns,
            tableName,
            startIndex,
            chunkSize,
        });

        try {
            const {data, found, total} = await fetchTableChunk(queryParams).unwrap();
            dispatch({
                type: 'UPDATE_DATA',
                payload: {
                    data: data as T[],
                    found,
                    total,
                    offset: queryParams.offset,
                },
            });
        } catch (e) {
            // Error is handled by RTK Query and available via error state
            console.error('Failed to fetch chunk data:', e);
        }
    }, [
        fetchTableChunk,
        fetchData,
        filters,
        columns,
        tableName,
        chunkSize,
        rowVirtualizer.range?.startIndex,
    ]);

    React.useEffect(() => {
        fetchChunkData();
    }, [fetchChunkData]);

    return {
        data: state.rows.filter((row: T | undefined): row is T => row !== undefined),
        isLoading: isFetching,
        error: error as IResponseError | undefined,
        totalEntities: state.totalEntities,
        foundEntities: state.foundEntities,
        rowVirtualizer,
        rows: state.rows,
    };
}
