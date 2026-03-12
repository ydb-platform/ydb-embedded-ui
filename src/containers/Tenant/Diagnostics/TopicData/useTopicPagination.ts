import React from 'react';

import {isNil} from 'lodash';

import {TOPIC_DATA_DEFAULT_PAGE_SIZE, TOPIC_DATA_MIN_TOTAL_FOR_PAGINATION} from './utils/constants';

interface UseTopicPaginationParams {
    baseOffset: number | undefined;
    endOffset: number | undefined;
}

interface UseTopicPaginationResult {
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalOffsets: number;
    usePagination: boolean;
    pageStartOffset: number | undefined;
    pageEntitiesCount: number;
}

export function useTopicPagination({
    baseOffset,
    endOffset,
}: UseTopicPaginationParams): UseTopicPaginationResult {
    const [currentPage, setCurrentPage] = React.useState(1);

    // Total number of offsets in the partition
    const totalOffsets = React.useMemo(() => {
        if (isNil(baseOffset) || isNil(endOffset)) {
            return 0;
        }
        return Math.max(endOffset - baseOffset, 0);
    }, [baseOffset, endOffset]);

    const usePagination = totalOffsets > TOPIC_DATA_MIN_TOTAL_FOR_PAGINATION;

    // Compute pageStartOffset for the current page.
    // When pagination is active: baseOffset + (currentPage - 1) * TOPIC_DATA_DEFAULT_PAGE_SIZE
    // When pagination is not active: baseOffset (show all offsets)
    const pageStartOffset = React.useMemo(() => {
        if (isNil(baseOffset)) {
            return undefined;
        }
        if (!usePagination) {
            return baseOffset;
        }
        return baseOffset + (currentPage - 1) * TOPIC_DATA_DEFAULT_PAGE_SIZE;
    }, [baseOffset, usePagination, currentPage]);

    // Number of entities on the current page
    const pageEntitiesCount = React.useMemo(() => {
        if (isNil(pageStartOffset) || isNil(endOffset)) {
            return 0;
        }
        const remaining = endOffset - pageStartOffset;
        return usePagination
            ? Math.max(Math.min(TOPIC_DATA_DEFAULT_PAGE_SIZE, remaining), 0)
            : Math.max(remaining, 0);
    }, [pageStartOffset, endOffset, usePagination]);

    return {
        currentPage,
        setCurrentPage,
        totalOffsets,
        usePagination,
        pageStartOffset,
        pageEntitiesCount,
    };
}
