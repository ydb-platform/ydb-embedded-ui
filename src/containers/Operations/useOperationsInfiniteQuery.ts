import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {throttle} from 'lodash';

import {parseControlPlaneOperation} from '../../services/parsers/parseControlPlaneOperation';
import {DEFAULT_PAGE_SIZE, operationsApi} from '../../store/reducers/operations';
import type {ControlPlaneOperationQueryParams} from '../../store/reducers/operations';
import type {OperationKind} from '../../types/api/operations';

import {filterControlPlaneOperations} from './utils';

interface UseOperationsInfiniteQueryProps {
    controlPlaneParams?: ControlPlaneOperationQueryParams;
    skipDatabase?: boolean;
    database: string;
    kind: OperationKind;
    pageSize?: number;
    searchValue: string;
    controlPlaneSearch?: string;
    controlPlaneStatus?: string;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

const DEFAULT_SCROLL_MARGIN = 100;

export function useOperationsInfiniteQuery({
    controlPlaneParams,
    skipDatabase = false,
    database,
    kind,
    pageSize = DEFAULT_PAGE_SIZE,
    searchValue,
    controlPlaneSearch = '',
    controlPlaneStatus = '',
    scrollContainerRef,
}: UseOperationsInfiniteQueryProps) {
    const databaseQuery = operationsApi.useGetOperationListInfiniteQuery(
        controlPlaneParams || skipDatabase ? skipToken : {database, kind, page_size: pageSize},
    );
    const controlPlaneQuery = operationsApi.useGetControlPlaneOperationListInfiniteQuery(
        controlPlaneParams ?? skipToken,
    );
    const {error, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = controlPlaneParams
        ? controlPlaneQuery
        : databaseQuery;

    // Flatten all pages into a single array of operations
    const allOperations = React.useMemo(() => {
        if (controlPlaneParams) {
            return (
                controlPlaneQuery.currentData?.pages.flatMap((page) =>
                    (page.operations ?? []).map(parseControlPlaneOperation),
                ) ?? []
            );
        }
        return databaseQuery.currentData?.pages.flatMap((page) => page.operations ?? []) ?? [];
    }, [controlPlaneParams, controlPlaneQuery.currentData, databaseQuery.currentData]);

    const filteredOperations = React.useMemo(() => {
        if (controlPlaneParams) {
            return filterControlPlaneOperations(
                allOperations,
                controlPlaneSearch,
                controlPlaneStatus,
            );
        }
        const preparedSearchValue = searchValue.trim().toLowerCase();

        if (!preparedSearchValue) {
            return allOperations;
        }
        return allOperations.filter((op) => op.id?.toLowerCase().includes(preparedSearchValue));
    }, [allOperations, searchValue, controlPlaneParams, controlPlaneSearch, controlPlaneStatus]);

    const checkAndLoadMorePages = React.useCallback(
        (fromScroll = false) => {
            const scrollContainer = scrollContainerRef?.current;
            if (!scrollContainer || !hasNextPage || isFetchingNextPage || error) {
                return;
            }

            const {scrollTop, scrollHeight, clientHeight} = scrollContainer;
            const shouldLoadMore = fromScroll
                ? scrollHeight - scrollTop - clientHeight < DEFAULT_SCROLL_MARGIN
                : scrollHeight <= clientHeight;
            if (shouldLoadMore) {
                fetchNextPage();
            }
        },
        [scrollContainerRef, hasNextPage, isFetchingNextPage, fetchNextPage, error],
    );

    // Check after data updates
    React.useLayoutEffect(() => {
        if (!isFetchingNextPage) {
            // RAF to ensure browser has completed layout and paint
            const raf = requestAnimationFrame(() => {
                checkAndLoadMorePages();
            });
            return () => cancelAnimationFrame(raf);
        }

        return undefined;
    }, [filteredOperations, isFetchingNextPage, checkAndLoadMorePages]);

    React.useEffect(() => {
        const scrollContainer = scrollContainerRef?.current;
        if (!scrollContainer) {
            return undefined;
        }

        const handleScroll = () => checkAndLoadMorePages(true);
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [scrollContainerRef, checkAndLoadMorePages]);

    // Resize handler to check if more content is needed when viewport changes
    React.useEffect(() => {
        const throttledHandleResize = throttle(() => checkAndLoadMorePages(), 200, {
            trailing: true,
            leading: true,
        });

        window.addEventListener('resize', throttledHandleResize);
        return () => {
            throttledHandleResize.cancel();
            window.removeEventListener('resize', throttledHandleResize);
        };
    }, [checkAndLoadMorePages]);

    return {
        operations: filteredOperations,
        totalLoaded: allOperations.length,
        isLoading,
        isLoadingMore: isFetchingNextPage,
        error,
    };
}
