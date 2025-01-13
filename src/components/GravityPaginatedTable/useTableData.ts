import React from 'react';

import {tableDataApi} from '../../store/reducers/tableData';
import type {IResponseError} from '../../types/api/error';
import type {FetchData} from '../PaginatedTable/types';

import type {
    BaseEntity,
    UseTableDataProps,
    UseTableDataResult,
} from './GravityPaginatedTable.types';

const DEFAULT_CHUNK_SIZE = 50;

export function useTableData<T extends BaseEntity, F>({
    fetchData,
    filters,
    tableName,
    columns,
    chunkSize = DEFAULT_CHUNK_SIZE,
    initialEntitiesCount = 0,
    autoRefreshInterval,
}: UseTableDataProps<T, F>): UseTableDataResult<T> {
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
            const processedData = (currentData.data as T[]).map((item, index) => ({
                ...item,
                id: item.NodeId ?? item.id ?? index,
            }));

            // Only set data if we're on the first page or loading more
            if (currentPage === 0) {
                setData(processedData);
            }

            setHasNextPage((currentPage + 1) * chunkSize < (currentData.total || 0));
        }
    }, [currentData, currentPage, chunkSize]);

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

            const newData = (result.data as T[]).map((item, index) => ({
                ...item,
                id: item.NodeId ?? item.id ?? nextPage * chunkSize + index,
            }));

            setData((prev) => {
                // Ensure we don't have duplicates and maintain order
                const existingIds = new Set(prev.map((item) => item.id));
                const uniqueNewData = newData.filter((item) => !existingIds.has(item.id));
                return [...prev, ...uniqueNewData];
            });
            setCurrentPage(nextPage);
            setHasNextPage((nextPage + 1) * chunkSize < (result.total || 0));
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasNextPage, isLoadingMore, currentPage, fetchData, baseQueryParams, chunkSize]);

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
