import React from 'react';

import {isNil} from 'lodash';

import {DEFAULT_TABLE_ROW_HEIGHT} from '../../../../components/PaginatedTable';
import type {TopicDataResponse} from '../../../../types/api/topic';
import {safeParseNumber} from '../../../../utils/utils';

import {TOPIC_DATA_DEFAULT_PAGE_SIZE} from './utils/constants';

interface UseTopicScrollParams {
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    baseOffset: number | undefined;
    endOffset: number | undefined;
    pageStartOffset: number | undefined;
    usePagination: boolean;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    selectedPartition: string | null | undefined;
    selectedOffset: number | null | undefined;
    startTimestamp: number | null | undefined;
    activeOffset: string | null | undefined;
    /** Current data from the probe query, used to scroll to first message */
    currentData: TopicDataResponse | undefined;
    isFetching: boolean;
}

interface UseTopicScrollResult {
    scrollToOffset: (newOffset: number) => void;
}

export function useTopicScroll({
    scrollContainerRef,
    baseOffset,
    endOffset,
    pageStartOffset,
    usePagination,
    currentPage,
    setCurrentPage,
    selectedPartition,
    selectedOffset,
    startTimestamp,
    activeOffset,
    currentData,
    isFetching,
}: UseTopicScrollParams): UseTopicScrollResult {
    // Ref to store pending scroll target after page change
    const pendingScrollOffset = React.useRef<number | undefined>();

    // Scroll to top synchronously before paint when page or partition changes
    const prevPage = React.useRef(currentPage);
    const prevPartition = React.useRef(selectedPartition);
    React.useLayoutEffect(() => {
        const pageChanged = prevPage.current !== currentPage;
        const partitionChanged = prevPartition.current !== selectedPartition;
        if (pageChanged || partitionChanged) {
            prevPage.current = currentPage;
            prevPartition.current = selectedPartition;
            const container = scrollContainerRef.current;
            if (container) {
                container.scrollTop = 0;
            }
        }
    }, [currentPage, selectedPartition, scrollContainerRef]);

    const scrollToOffset = React.useCallback(
        (newOffset: number) => {
            if (isNil(baseOffset) || isNil(endOffset) || isNil(pageStartOffset)) {
                return;
            }

            // Guard: offset is out of partition range — nothing to navigate to
            if (newOffset < baseOffset || newOffset >= endOffset) {
                return;
            }

            if (usePagination) {
                // Calculate which page this offset belongs to (1-based)
                const absoluteRow = newOffset - baseOffset;
                const targetPage = Math.floor(absoluteRow / TOPIC_DATA_DEFAULT_PAGE_SIZE) + 1;

                if (targetPage !== currentPage) {
                    // Need to switch page first, then scroll after render
                    pendingScrollOffset.current = newOffset;
                    setCurrentPage(targetPage);
                    return;
                }
            }

            const scrollTop = (newOffset - pageStartOffset) * DEFAULT_TABLE_ROW_HEIGHT;
            const normalizedScrollTop = Math.max(0, scrollTop);
            scrollContainerRef.current?.scrollTo({
                top: normalizedScrollTop,
                behavior: 'instant',
            });
        },
        [
            pageStartOffset,
            baseOffset,
            endOffset,
            usePagination,
            currentPage,
            setCurrentPage,
            scrollContainerRef,
        ],
    );

    // Keep a ref to the latest scrollToOffset to avoid stale closure in useEffect
    const scrollToOffsetRef = React.useRef(scrollToOffset);
    React.useLayoutEffect(() => {
        scrollToOffsetRef.current = scrollToOffset;
    }, [scrollToOffset]);

    // Handle pending scroll after page change.
    // Uses scrollToOffsetRef to always call the latest version without adding scrollToOffset to deps.
    React.useEffect(() => {
        const pending = pendingScrollOffset.current;
        if (!isNil(pending)) {
            pendingScrollOffset.current = undefined;
            scrollToOffsetRef.current(pending);
        }
    }, [currentPage]);

    // On first open: scroll to the offset from URL (selectedOffset or activeOffset).
    // Consumed once and cleared so subsequent data loads don't re-trigger the scroll.
    const initialScrollToOffset = React.useRef(selectedOffset ?? activeOffset);

    // When selectedOffset or startTimestamp changes, scroll to the first message returned by the API.
    const shouldScrollToFirstMessage = React.useRef(false);
    React.useEffect(() => {
        shouldScrollToFirstMessage.current = true;
    }, [selectedOffset, startTimestamp]);

    React.useEffect(() => {
        if (isFetching || isNil(baseOffset) || isNil(endOffset)) {
            return;
        }

        // Case 1: first open — scroll to the initial offset from URL
        if (!isNil(initialScrollToOffset.current)) {
            const targetOffset = Number(initialScrollToOffset.current);
            initialScrollToOffset.current = undefined;
            shouldScrollToFirstMessage.current = false;
            scrollToOffsetRef.current(targetOffset);
            return;
        }

        // Case 2: selectedOffset changed — scroll to the first message from API response
        if (shouldScrollToFirstMessage.current) {
            shouldScrollToFirstMessage.current = false;
            const firstMessage = currentData?.Messages?.[0];
            if (!isNil(firstMessage)) {
                scrollToOffsetRef.current(safeParseNumber(firstMessage.Offset));
            }
        }
    }, [currentData, isFetching, baseOffset, endOffset]);

    return {scrollToOffset};
}
