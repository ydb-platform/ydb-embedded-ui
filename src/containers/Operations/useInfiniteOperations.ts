import React from 'react';

import {throttle} from 'lodash';

import {operationsApi} from '../../store/reducers/operations';
import type {OperationKind, TOperation} from '../../types/api/operations';

interface UseInfiniteOperationsProps {
    database: string;
    kind: OperationKind;
    pageSize?: number;
    searchValue: string;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SCROLL_MARGIN = 100;

export function useInfiniteOperations({
    database,
    kind,
    pageSize = DEFAULT_PAGE_SIZE,
    searchValue,
    scrollContainerRef,
}: UseInfiniteOperationsProps) {
    const [operationsList, setOperationsList] = React.useState<TOperation[]>([]);
    const [nextPageToken, setNextPageToken] = React.useState<string | undefined>();

    const [loadPage, {isFetching, error}] = operationsApi.useLazyGetOperationListQuery();

    // Load a page and update state
    const loadPageAndUpdate = React.useCallback(
        async (
            params: {
                database: string;
                kind: OperationKind;
                page_size: number;
                page_token?: string;
            },
            isInitial = false,
        ) => {
            try {
                const result = await loadPage(params).unwrap();

                if (result?.operations) {
                    if (isInitial) {
                        // Initial load or refresh - replace data
                        setOperationsList(result.operations);
                    } else {
                        // Pagination - append data
                        setOperationsList((prev) => [...prev, ...result.operations!]);
                    }
                    setNextPageToken(
                        result.next_page_token === '0' ? undefined : result.next_page_token,
                    );
                }
            } catch (err) {
                // Error is handled by RTK Query
                console.error('Failed to load operations:', err);
            }
        },
        [loadPage],
    );

    // Load initial page when kind/search changes
    React.useLayoutEffect(() => {
        setOperationsList([]);
        setNextPageToken(undefined);
        loadPageAndUpdate({database, kind, page_size: pageSize}, true);
    }, [kind, searchValue, database, pageSize, loadPageAndUpdate]);

    // Check if we need to load more pages to fill the viewport
    const checkAndLoadMorePages = React.useCallback(async () => {
        const scrollContainer = scrollContainerRef?.current;
        if (!scrollContainer || !nextPageToken || isFetching) {
            return;
        }

        const {scrollHeight, clientHeight} = scrollContainer;

        // If content height is less than or equal to viewport height, load more
        if (scrollHeight <= clientHeight) {
            await loadPageAndUpdate({
                database,
                kind,
                page_size: pageSize,
                page_token: nextPageToken,
            });
        }
    }, [
        scrollContainerRef,
        nextPageToken,
        isFetching,
        database,
        kind,
        pageSize,
        loadPageAndUpdate,
    ]);

    // Check if we need to load more pages after data updates
    React.useLayoutEffect(() => {
        if (!isFetching) {
            checkAndLoadMorePages();
        }
    }, [operationsList, isFetching, checkAndLoadMorePages]);

    // Scroll handler
    React.useEffect(() => {
        const scrollContainer = scrollContainerRef?.current;
        if (!scrollContainer) {
            return undefined;
        }

        const handleScroll = () => {
            const {scrollTop, scrollHeight, clientHeight} = scrollContainer;

            if (
                scrollHeight - scrollTop - clientHeight < DEFAULT_SCROLL_MARGIN &&
                nextPageToken &&
                !isFetching
            ) {
                loadPageAndUpdate({database, kind, page_size: pageSize, page_token: nextPageToken});
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [
        scrollContainerRef,
        nextPageToken,
        isFetching,
        database,
        kind,
        pageSize,
        loadPageAndUpdate,
    ]);

    // Resize handler - check if we need to load more pages when viewport changes
    React.useEffect(() => {
        const throttledHandleResize = throttle(
            () => {
                checkAndLoadMorePages();
            },
            200,
            {
                trailing: true,
                leading: true,
            },
        );

        window.addEventListener('resize', throttledHandleResize);
        return () => {
            window.removeEventListener('resize', throttledHandleResize);
        };
    }, [checkAndLoadMorePages]);

    // Filter operations
    const filteredOperations = React.useMemo(() => {
        return operationsList.filter((op) =>
            op.id?.toLowerCase().includes(searchValue.toLowerCase()),
        );
    }, [operationsList, searchValue]);

    const refreshTable = React.useCallback(() => {
        setOperationsList([]);
        setNextPageToken(undefined);
        loadPageAndUpdate({database, kind, page_size: pageSize}, true);
    }, [database, kind, pageSize, loadPageAndUpdate]);

    // Listen for diagnostics refresh events
    React.useEffect(() => {
        document.addEventListener('diagnosticsRefresh', refreshTable);
        return () => {
            document.removeEventListener('diagnosticsRefresh', refreshTable);
        };
    }, [refreshTable]);

    return {
        operations: filteredOperations,
        isLoading: isFetching && operationsList.length === 0,
        isLoadingMore: isFetching && operationsList.length > 0,
        error,
        refreshTable,
        totalCount: operationsList.length,
    };
}
