import React from 'react';

import {operationsApi} from '../../store/reducers/operations';
import type {OperationKind, TOperation} from '../../types/api/operations';

interface UseInfiniteOperationsProps {
    database: string;
    kind: OperationKind;
    pageSize?: number;
    searchValue: string;
    pollingInterval?: number;
}

export function useInfiniteOperations({
    database,
    kind,
    pageSize,
    searchValue,
    pollingInterval,
}: UseInfiniteOperationsProps) {
    // Accumulated operations from all loaded pages
    const [allOperations, setAllOperations] = React.useState<TOperation[]>([]);

    // Current page token for next page
    const [currentPageToken, setCurrentPageToken] = React.useState<string | undefined>();

    // Track if we have more pages to load
    const [hasNextPage, setHasNextPage] = React.useState(true);

    // Track loading state for infinite scroll
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);

    // Current page query
    const {data, isLoading, error, refetch} = operationsApi.useGetOperationListQuery(
        {database, kind, page_size: pageSize, page_token: currentPageToken},
        {
            pollingInterval,
            skip: !hasNextPage && currentPageToken !== undefined,
        },
    );

    // Reset everything when search or kind changes
    React.useEffect(() => {
        setAllOperations([]);
        setCurrentPageToken(undefined);
        setHasNextPage(true);
        setIsLoadingMore(false);
    }, [searchValue, kind]);

    // Accumulate operations when new data arrives
    React.useEffect(() => {
        if (data?.operations) {
            if (currentPageToken === undefined) {
                // First page - replace all operations
                setAllOperations(data.operations);
            } else {
                // Subsequent pages - append to existing operations
                setAllOperations((prev) => [...prev, ...data.operations!]);
            }

            // Update pagination state
            setHasNextPage(Boolean(data.next_page_token));
            setIsLoadingMore(false);
        }
    }, [data, currentPageToken]);

    // Function to load next page
    const loadNextPage = React.useCallback(() => {
        if (data?.next_page_token && !isLoadingMore && !isLoading) {
            setIsLoadingMore(true);
            setCurrentPageToken(data.next_page_token);
        }
    }, [data?.next_page_token, isLoadingMore, isLoading]);

    // Filter operations based on search
    const filteredOperations = React.useMemo(() => {
        if (!searchValue) {
            return allOperations;
        }
        return allOperations.filter((op) =>
            op.id?.toLowerCase().includes(searchValue.toLowerCase()),
        );
    }, [allOperations, searchValue]);

    // Refresh function that resets pagination
    const refreshTable = React.useCallback(() => {
        setAllOperations([]);
        setCurrentPageToken(undefined);
        setHasNextPage(true);
        setIsLoadingMore(false);
        refetch();
    }, [refetch]);

    return {
        operations: filteredOperations,
        isLoading: isLoading && currentPageToken === undefined, // Only show loading for first page
        isLoadingMore,
        error,
        hasNextPage,
        loadNextPage,
        refreshTable,
        totalCount: allOperations.length,
    };
}
