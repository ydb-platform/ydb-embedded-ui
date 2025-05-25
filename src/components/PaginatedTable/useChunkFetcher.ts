import React from 'react';

import type {FetchData, PaginatedTableData, SortParams} from './types';

interface UseChunkFetcherProps<T, F> {
    fetchData: FetchData<T, F>;
    filters?: F;
    sortParams?: SortParams;
    columnsIds: string[];
    chunkSize: number;
    visibleRange?: {startIndex: number; endIndex: number};
    onDataFetched?: (data: PaginatedTableData<T>) => void;
}

interface UseChunkFetcherResult<T> {
    dataMap: Map<number, T>;
    isLoading: boolean;
    error: any;
    totalEntities: number;
    foundEntities: number;
    loadingChunks: Set<number>;
}

/**
 * Hook for fetching data chunks based on visible rows
 * This hook handles fetching data for visible chunks and manages loading/error states
 * Uses a sparse data map to properly handle virtualized data
 */
export const useChunkFetcher = <T, F>({
    fetchData,
    filters,
    sortParams,
    columnsIds,
    chunkSize,
    visibleRange,
    onDataFetched,
}: UseChunkFetcherProps<T, F>): UseChunkFetcherResult<T> => {
    const [dataMap, setDataMap] = React.useState<Map<number, T>>(new Map());
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<any>(null);
    const [totalEntities, setTotalEntities] = React.useState(0);
    const [foundEntities, setFoundEntities] = React.useState(0);
    const [loadingChunks, setLoadingChunks] = React.useState<Set<number>>(new Set());

    // Cache for request parameters to avoid duplicate requests
    const requestCacheRef = React.useRef(new Map<string, boolean>());

    // Timeout reference for debouncing
    const timeoutRef = React.useRef<number | null>(null);

    // Calculate which chunks we need to fetch based on visible rows
    const chunksToFetch = React.useMemo(() => {
        if (!visibleRange) {
            return [];
        }

        const startChunk = Math.floor(visibleRange.startIndex / chunkSize);
        const endChunk = Math.floor(visibleRange.endIndex / chunkSize);

        const chunks = [];
        for (let i = startChunk; i <= endChunk; i++) {
            chunks.push(i);
        }

        return chunks;
    }, [visibleRange, chunkSize]);

    // Create a request key for caching
    const requestKey = React.useMemo(() => {
        return JSON.stringify({
            chunks: chunksToFetch,
            filters,
            sortParams,
            columnsIds,
        });
    }, [chunksToFetch, filters, sortParams, columnsIds]);

    // Clear data when filters or sorting changes
    const clearDataKey = React.useMemo(() => {
        return JSON.stringify({
            filters,
            sortParams,
            columnsIds,
        });
    }, [filters, sortParams, columnsIds]);

    React.useEffect(() => {
        // Clear all data when filters/sorting changes
        setDataMap(new Map());
        requestCacheRef.current.clear();
    }, [clearDataKey]);

    // Function to fetch data - called only when needed
    const fetchChunksData = React.useCallback(async () => {
        // If we've already made this exact request, don't repeat it
        if (requestCacheRef.current.has(requestKey)) {
            return;
        }

        // If there are no chunks to fetch, don't do anything
        if (chunksToFetch.length === 0) {
            return;
        }

        // With sparse data map, we can fetch all requested chunks
        // The data map will handle duplicates naturally
        if (chunksToFetch.length === 0) {
            return;
        }

        // Clear any pending timeout
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
        }

        // Set a new timeout for debouncing
        timeoutRef.current = window.setTimeout(async () => {
            try {
                // Mark this request as in progress
                requestCacheRef.current.set(requestKey, true);

                setIsLoading(true);
                setError(null);

                // Mark chunks as loading
                setLoadingChunks(new Set(chunksToFetch));

                let total = 0;
                let found = 0;
                const newDataMap = new Map<number, T>();

                // Fetch data for each chunk sequentially
                for (const chunkId of chunksToFetch) {
                    const offset = chunkId * chunkSize;

                    const result = await fetchData({
                        offset,
                        limit: chunkSize,
                        filters,
                        sortParams,
                        columnsIds,
                    });

                    if (result.data) {
                        // Add data to map with proper row indices
                        result.data.forEach((item, index) => {
                            const rowIndex = offset + index;
                            newDataMap.set(rowIndex, item);
                        });

                        total = result.total;
                        found = result.found;
                    }
                }

                // Update state with new data
                setDataMap((prevDataMap) => {
                    const updatedMap = new Map(prevDataMap);
                    newDataMap.forEach((value, key) => {
                        updatedMap.set(key, value);
                    });
                    return updatedMap;
                });

                setTotalEntities(total);
                setFoundEntities(found);

                if (onDataFetched) {
                    // For backward compatibility, create array from new data
                    const allData = Array.from(newDataMap.values());
                    onDataFetched({
                        data: allData,
                        total,
                        found,
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
                setLoadingChunks(new Set()); // Clear loading chunks
                timeoutRef.current = null;
            }
        }, 200); // 200ms debounce
    }, [
        requestKey,
        chunksToFetch,
        chunkSize,
        fetchData,
        filters,
        sortParams,
        columnsIds,
        onDataFetched,
    ]);

    // Trigger the fetch when the request key changes
    React.useLayoutEffect(() => {
        fetchChunksData();

        // Cleanup function to clear timeout if component unmounts
        return () => {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [fetchChunksData]);

    // Limit the cache size to prevent memory leaks
    React.useEffect(() => {
        if (requestCacheRef.current.size > 50) {
            // Keep only the 20 most recent entries
            const entries = Array.from(requestCacheRef.current.entries());
            const recentEntries = entries.slice(-20);
            requestCacheRef.current = new Map(recentEntries);
        }
    }, [requestKey]);

    return {
        dataMap,
        isLoading,
        error,
        totalEntities,
        foundEntities,
        loadingChunks,
    };
};
