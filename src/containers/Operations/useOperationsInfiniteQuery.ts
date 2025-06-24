import React from 'react';

import {throttle} from 'lodash';

import {operationsApi} from '../../store/reducers/operations';
import type {OperationKind} from '../../types/api/operations';

interface UseOperationsInfiniteQueryProps {
    database: string;
    kind: OperationKind;
    pageSize?: number;
    searchValue: string;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

const DEFAULT_SCROLL_MARGIN = 100;

export function useOperationsInfiniteQuery({
    database,
    kind,
    pageSize = 10,
    searchValue,
    scrollContainerRef,
}: UseOperationsInfiniteQueryProps) {
    const {data, error, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch} =
        operationsApi.useGetOperationListInfiniteInfiniteQuery({
            database,
            kind,
            page_size: pageSize,
        });

    // Flatten all pages into a single array of operations
    const allOperations = React.useMemo(() => {
        if (!data?.pages) {
            return [];
        }
        // Each page is a TOperationList, so we need to extract operations from each
        return data.pages.flatMap((page) => page.operations || []);
    }, [data]);

    const filteredOperations = React.useMemo(() => {
        if (!searchValue) {
            return allOperations;
        }
        return allOperations.filter((op) =>
            op.id?.toLowerCase().includes(searchValue.toLowerCase()),
        );
    }, [allOperations, searchValue]);

    // Auto-load more pages to fill viewport
    const checkAndLoadMorePages = React.useCallback(async () => {
        const scrollContainer = scrollContainerRef?.current;
        if (!scrollContainer || !hasNextPage || isFetchingNextPage) {
            return;
        }

        const {scrollHeight, clientHeight} = scrollContainer;
        if (scrollHeight <= clientHeight) {
            await fetchNextPage();
        }
    }, [scrollContainerRef, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Check after data updates
    React.useLayoutEffect(() => {
        if (!isFetchingNextPage) {
            checkAndLoadMorePages();
        }
    }, [data, isFetchingNextPage, checkAndLoadMorePages]);

    // Scroll handler for infinite scrolling
    React.useEffect(() => {
        const scrollContainer = scrollContainerRef?.current;
        if (!scrollContainer) {
            return undefined;
        }

        const handleScroll = () => {
            const {scrollTop, scrollHeight, clientHeight} = scrollContainer;

            if (
                scrollHeight - scrollTop - clientHeight < DEFAULT_SCROLL_MARGIN &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [scrollContainerRef, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Resize handler to check if more content is needed when viewport changes
    React.useEffect(() => {
        const throttledHandleResize = throttle(checkAndLoadMorePages, 200, {
            trailing: true,
            leading: true,
        });

        window.addEventListener('resize', throttledHandleResize);
        return () => {
            throttledHandleResize.cancel();
            window.removeEventListener('resize', throttledHandleResize);
        };
    }, [checkAndLoadMorePages]);

    // Listen for diagnostics refresh events
    React.useEffect(() => {
        const handleRefresh = () => refetch();
        document.addEventListener('diagnosticsRefresh', handleRefresh);
        return () => document.removeEventListener('diagnosticsRefresh', handleRefresh);
    }, [refetch]);

    return {
        operations: filteredOperations,
        isLoading,
        isLoadingMore: isFetchingNextPage,
        error,
        refreshTable: refetch,
        totalCount: allOperations.length,
    };
}
