import React from 'react';

import {operationsApi} from '../../../../../../store/reducers/operations';
import type {TOperation} from '../../../../../../types/api/operations';
import {useAutoRefreshInterval, useTypedDispatch} from '../../../../../../utils/hooks';
import {
    TABLE_COMPACTION_OPERATION_PAGE_SIZE,
    findRunningTableCompactionOperation,
} from '../../../../../../utils/tableCompaction';

interface UseTableCompactionResult {
    operations: TOperation[] | undefined;
    runningCompaction: TOperation | undefined;
    isFetching: boolean;
    refresh: () => void;
}

/**
 * Hook for managing table compaction operations.
 * Automatically fetches all pages of compaction operations and tracks running compaction.
 * @param database - Database path
 * @param path - Table path
 * @param enabled - Whether compaction feature is enabled
 * @returns Compaction operations data and loading state
 */
export function useTableCompaction(
    database: string,
    path: string,
    enabled: boolean,
): UseTableCompactionResult {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const dispatch = useTypedDispatch();

    const {
        currentData: compactionData,
        isFetching,
        hasNextPage,
        fetchNextPage,
    } = operationsApi.useGetOperationListInfiniteQuery(
        {database, kind: 'compaction', page_size: TABLE_COMPACTION_OPERATION_PAGE_SIZE},
        {
            pollingInterval: autoRefreshInterval,
            skip: !enabled,
        },
    );

    // Automatically fetch all pages to get complete list of operations
    React.useEffect(() => {
        if (hasNextPage && !isFetching) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetching, fetchNextPage]);

    const operations = React.useMemo(
        () => compactionData?.pages?.flatMap((page) => page.operations ?? []),
        [compactionData],
    );

    const runningCompaction = React.useMemo(
        () => findRunningTableCompactionOperation(operations, path),
        [operations, path],
    );

    const refresh = React.useCallback(() => {
        dispatch(operationsApi.util.invalidateTags([{type: 'OperationList', id: 'compaction'}]));
    }, [dispatch]);

    return {
        operations,
        runningCompaction,
        isFetching,
        refresh,
    };
}
