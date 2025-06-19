import React from 'react';

import {operationsApi} from '../../store/reducers/operations';
import type {OperationKind, TOperation} from '../../types/api/operations';

interface UseInfiniteOperationsProps {
    database: string;
    kind: OperationKind;
    pageSize?: number;
    searchValue: string;
    pollingInterval?: number;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SCROLL_MARGIN = 100;

export function useInfiniteOperations({
    database,
    kind,
    pageSize = DEFAULT_PAGE_SIZE,
    searchValue,
    pollingInterval,
    scrollContainerRef,
}: UseInfiniteOperationsProps) {
    const [operationsList, setOperationsList] = React.useState<TOperation[]>([]);
    const [nextPageToken, setNextPageToken] = React.useState<string | undefined>();

    const [loadPage, {data, isFetching, error}] = operationsApi.useLazyGetOperationListQuery({
        pollingInterval,
    });

    // Load initial page when kind/search changes
    React.useEffect(() => {
        setOperationsList([]);
        setNextPageToken(undefined);
        loadPage({database, kind, page_size: pageSize});
    }, [kind, searchValue, database, pageSize, loadPage]);

    // When data arrives, update state
    React.useEffect(() => {
        if (data?.operations) {
            setOperationsList((prev) => [...prev, ...data.operations!]);
            setNextPageToken(data.next_page_token === '0' ? undefined : data.next_page_token);
        }
    }, [data]);

    // Scroll handler
    React.useEffect(() => {
        const scrollContainer = scrollContainerRef?.current;
        if (!scrollContainer) {
            return;
        }

        const handleScroll = () => {
            const {scrollTop, scrollHeight, clientHeight} = scrollContainer;

            if (
                scrollHeight - scrollTop - clientHeight < DEFAULT_SCROLL_MARGIN &&
                nextPageToken &&
                !isFetching
            ) {
                loadPage({database, kind, page_size: pageSize, page_token: nextPageToken});
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [scrollContainerRef, nextPageToken, isFetching, database, kind, pageSize, loadPage]);

    // Filter operations
    const filteredOperations = React.useMemo(() => {
        return operationsList.filter((op) =>
            op.id?.toLowerCase().includes(searchValue.toLowerCase()),
        );
    }, [operationsList, searchValue]);

    const refreshTable = React.useCallback(() => {
        setOperationsList([]);
        setNextPageToken(undefined);
        loadPage({database, kind, page_size: pageSize});
    }, []);

    return {
        operations: filteredOperations,
        isLoading: isFetching && operationsList.length === 0,
        isLoadingMore: isFetching && operationsList.length > 0,
        error,
        refreshTable,
        totalCount: operationsList.length,
    };
}
