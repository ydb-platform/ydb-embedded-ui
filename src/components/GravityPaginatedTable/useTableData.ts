import React from 'react';

import {tableDataApi} from '../../store/reducers/tableData';
import type {IResponseError} from '../../types/api/error';
import type {FetchData} from '../PaginatedTable/types';

import type {UseTableDataProps, UseTableDataResult} from './types';

const DEFAULT_CHUNK_SIZE = 50;

export function useTableData<T, F>({
    fetchData,
    filters,
    tableName,
    columns,
    chunkSize = DEFAULT_CHUNK_SIZE,
    initialEntitiesCount = 0,
    autoRefreshInterval,
    getRowId,
}: UseTableDataProps<T, F>): UseTableDataResult<T> {
    // Create a wrapper function to handle fallback index-based IDs
    const getItemId = React.useCallback(
        (item: T, index: number) => getRowId(item) ?? index,
        [getRowId],
    );
    const [data, setData] = React.useState<T[]>([]);
    const [currentPage, setCurrentPage] = React.useState(0);
    const [hasNextPage, setHasNextPage] = React.useState(true);
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);

    // Create base query parameters
    const baseQueryParams = React.useMemo(
        () => ({
            fetchData: fetchData as FetchData<unknown, unknown>,
            filters,
            columnsIds: columns.map((col) => col.name),
            tableName,
        }),
        [fetchData, filters, columns, tableName],
    );

    // Initial data fetch
    const {
        data: currentData,
        error,
        isFetching,
    } = tableDataApi.useFetchTableChunkQuery(
        {
            ...baseQueryParams,
            offset: 0,
            limit: chunkSize,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    // Reset state when filters or tableName change
    React.useEffect(() => {
        setCurrentPage(0);
        setData([]);
        setHasNextPage(true);
        setIsLoadingMore(false);
    }, [filters, tableName]);

    // Process initial data
    React.useEffect(() => {
        if (currentData?.data) {
            const processedData = (currentData.data as T[]).map((item, index) => {
                const id = getItemId(item, index);
                return {...item, id};
            });

            // Only set data if we're on the first page or loading more
            if (currentPage === 0) {
                setData(processedData);
            }

            setHasNextPage((currentPage + 1) * chunkSize < (currentData.total || 0));
        }
    }, [currentData, currentPage, chunkSize, getItemId]);

    // Load more data
    const loadMoreData = React.useCallback(async () => {
        if (!hasNextPage || isLoadingMore) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const result = await fetchData({
                ...baseQueryParams,
                offset: nextPage * chunkSize,
                limit: chunkSize,
            });

            const newData = (result.data as T[]).map((item, index) => {
                const id = getItemId(item, nextPage * chunkSize + index);
                return {...item, id};
            });

            setData((prev) => {
                // Ensure we don't have duplicates and maintain order
                const existingIds = new Set(prev.map((item) => getItemId(item, 0)));
                const uniqueNewData = newData.filter(
                    (item) => !existingIds.has(getItemId(item, 0)),
                );
                return [...prev, ...uniqueNewData];
            });
            setCurrentPage(nextPage);
            setHasNextPage((nextPage + 1) * chunkSize < (result.total || 0));
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasNextPage, isLoadingMore, currentPage, fetchData, baseQueryParams, chunkSize, getItemId]);

    return {
        data,
        isLoading: isFetching,
        isLoadingMore,
        hasNextPage,
        error: error as IResponseError | undefined,
        totalEntities: currentData?.total || initialEntitiesCount,
        foundEntities: currentData?.found || 0,
        loadMoreData,
    };
}
