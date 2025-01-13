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

    // Process initial data
    React.useEffect(() => {
        if (currentData?.data) {
            const processedData = (currentData.data as T[]).map((item, index) => ({
                ...item,
                id: item.NodeId ?? item.id ?? index,
            }));
            setData(processedData);
            setHasNextPage(processedData.length < (currentData.total || 0));
        }
    }, [currentData]);

    // Load more data
    const loadMoreData = React.useCallback(async () => {
        if (!hasNextPage || isLoadingMore) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const result = await fetchData({
                ...baseQueryParams,
                offset: data.length,
                limit: chunkSize,
            });

            const newData = (result.data as T[]).map((item, index) => ({
                ...item,
                id: item.NodeId ?? item.id ?? data.length + index,
            }));

            setData((prev) => [...prev, ...newData]);
            setHasNextPage(data.length + newData.length < (result.total || 0));
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasNextPage, isLoadingMore, data.length, fetchData, baseQueryParams, chunkSize]);

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
