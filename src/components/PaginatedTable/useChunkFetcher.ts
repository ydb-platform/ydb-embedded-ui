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

interface ChunkFetchResult<T> {
    chunkId: number;
    result?: PaginatedTableData<T>;
    error?: any;
    success?: boolean;
    cancelled?: boolean;
}

const THROTTLE_INTERVAL = 100; // ms - faster response than debouncing

/**
 * Hook for fetching data chunks with throttling and cancellation
 * Features:
 * - Throttling instead of debouncing for immediate response
 * - Request cancellation for out-of-view chunks
 * - Parallel chunk fetching for better performance
 * - Proper cleanup and error handling
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
    const [fetchedChunks, setFetchedChunks] = React.useState<Set<number>>(new Set());

    // Throttling state
    const lastExecutionRef = React.useRef<number>(0);
    const throttleTimeoutRef = React.useRef<number | null>(null);

    // Track active requests for cancellation
    const activeRequestsRef = React.useRef<Map<number, AbortController>>(new Map());

    // Cache for request parameters to avoid duplicate requests
    const requestCacheRef = React.useRef(new Map<string, boolean>());

    // Calculate which chunks we need to fetch based on visible rows
    const chunksToFetch = React.useMemo(() => {
        if (!visibleRange) {
            return [];
        }

        const startChunk = Math.floor(visibleRange.startIndex / chunkSize);
        const endChunk = Math.floor(visibleRange.endIndex / chunkSize);

        const chunks = [];
        for (let i = startChunk; i <= endChunk; i++) {
            // Only include chunks that haven't been fetched yet and aren't currently loading
            if (!fetchedChunks.has(i) && !loadingChunks.has(i)) {
                chunks.push(i);
            }
        }

        return chunks;
    }, [visibleRange, chunkSize, fetchedChunks, loadingChunks]);

    // Cancel requests for chunks that are no longer visible
    const cancelOutOfViewChunks = React.useCallback((currentVisibleChunks: number[]) => {
        const visibleChunkSet = new Set(currentVisibleChunks);

        activeRequestsRef.current.forEach((controller, chunkId) => {
            if (!visibleChunkSet.has(chunkId)) {
                controller.abort();
                activeRequestsRef.current.delete(chunkId);

                // Remove from loading chunks
                setLoadingChunks((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(chunkId);
                    return newSet;
                });
            }
        });
    }, []);

    // Fetch multiple chunks concurrently
    const fetchChunksConcurrently = React.useCallback(
        async (chunks: number[]) => {
            // Cancel any out-of-view chunks first
            cancelOutOfViewChunks(chunks);

            const fetchPromises = chunks.map(async (chunkId): Promise<ChunkFetchResult<T>> => {
                const controller = new AbortController();
                activeRequestsRef.current.set(chunkId, controller);

                try {
                    const offset = chunkId * chunkSize;
                    const result = await fetchData({
                        offset,
                        limit: chunkSize,
                        filters,
                        sortParams,
                        columnsIds,
                        signal: controller.signal,
                    });

                    return {chunkId, result, success: true};
                } catch (error: any) {
                    if (error?.name === 'AbortError') {
                        return {chunkId, cancelled: true};
                    }
                    return {chunkId, error, success: false};
                } finally {
                    activeRequestsRef.current.delete(chunkId);
                }
            });

            return Promise.allSettled(fetchPromises);
        },
        [fetchData, chunkSize, filters, sortParams, columnsIds, cancelOutOfViewChunks],
    );

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
        setFetchedChunks(new Set());
        setLoadingChunks(new Set());
        requestCacheRef.current.clear();

        // Cancel all active requests
        activeRequestsRef.current.forEach((controller) => {
            controller.abort();
        });
        activeRequestsRef.current.clear();
    }, [clearDataKey]);

    // Main fetch function
    const executeChunkFetch = React.useCallback(async () => {
        // If we've already made this exact request, don't repeat it
        if (requestCacheRef.current.has(requestKey)) {
            return;
        }

        // If there are no chunks to fetch, don't do anything
        if (chunksToFetch.length === 0) {
            return;
        }

        try {
            // Mark this request as in progress
            requestCacheRef.current.set(requestKey, true);

            setIsLoading(true);
            setError(null);

            // Mark chunks as loading
            setLoadingChunks(new Set(chunksToFetch));

            const results = await fetchChunksConcurrently(chunksToFetch);

            let total = 0;
            let found = 0;
            let rawResult: PaginatedTableData<T> | null = null;
            const newDataMap = new Map<number, T>();
            const successfullyFetchedChunks = new Set<number>();
            let hasErrors = false;
            let lastError: any = null;

            // Process results
            results.forEach((settledResult) => {
                if (settledResult.status === 'fulfilled') {
                    const result = settledResult.value as ChunkFetchResult<T>;

                    if (result.success && result.result) {
                        // Add data to map with proper row indices
                        const offset = result.chunkId * chunkSize;
                        result.result.data.forEach((item, index) => {
                            const rowIndex = offset + index;
                            newDataMap.set(rowIndex, item);
                        });

                        total = result.result.total;
                        found = result.result.found;
                        rawResult = result.result;
                        successfullyFetchedChunks.add(result.chunkId);
                    } else if (result.error && !result.cancelled) {
                        hasErrors = true;
                        lastError = result.error;
                    }
                    // Ignore cancelled requests
                }
            });

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

            // Mark chunks as successfully fetched
            setFetchedChunks((prev) => new Set([...prev, ...successfullyFetchedChunks]));

            // Set error only if we have actual errors (not cancellations)
            if (hasErrors) {
                setError(lastError);
            }

            if (onDataFetched && rawResult) {
                // For backward compatibility, create array from new data
                const allData = Array.from(newDataMap.values());
                onDataFetched({
                    ...(rawResult as PaginatedTableData<T>),
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
        }
    }, [requestKey, chunksToFetch, fetchChunksConcurrently, chunkSize, onDataFetched]);

    // Throttled execution function
    const throttledExecute = React.useCallback(() => {
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecutionRef.current;

        if (timeSinceLastExecution >= THROTTLE_INTERVAL) {
            // Execute immediately
            lastExecutionRef.current = now;
            executeChunkFetch();
        } else {
            // Schedule execution for remaining time
            if (throttleTimeoutRef.current) {
                clearTimeout(throttleTimeoutRef.current);
            }

            const remainingTime = THROTTLE_INTERVAL - timeSinceLastExecution;
            throttleTimeoutRef.current = window.setTimeout(() => {
                lastExecutionRef.current = Date.now();
                executeChunkFetch();
            }, remainingTime);
        }
    }, [executeChunkFetch]);

    // Trigger the fetch when the request key changes
    React.useLayoutEffect(() => {
        throttledExecute();
    }, [throttledExecute]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            // Clear throttle timeout
            if (throttleTimeoutRef.current) {
                clearTimeout(throttleTimeoutRef.current);
            }

            // Cancel all active requests
            activeRequestsRef.current.forEach((controller) => {
                controller.abort();
            });
            activeRequestsRef.current.clear();
        };
    }, []);

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
