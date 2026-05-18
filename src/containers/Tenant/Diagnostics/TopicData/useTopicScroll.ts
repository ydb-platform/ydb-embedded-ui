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
    /** Current data from the probe query, used to resolve the first-message offset. */
    currentData: TopicDataResponse | undefined;
    isFetching: boolean;
}

interface UseTopicScrollResult {
    scrollToOffset: (newOffset: number) => void;
}

/** Page (1-based) that contains the given absolute offset, given the partition's base offset. */
function getTargetPage(offset: number, baseOffset: number): number {
    return Math.floor((offset - baseOffset) / TOPIC_DATA_DEFAULT_PAGE_SIZE) + 1;
}

/**
 * Initial pending scroll target from URL params: explicit selectedOffset wins,
 * otherwise fall back to activeOffset (which may legitimately be "0").
 */
function getInitialTarget(
    selectedOffset: number | null | undefined,
    activeOffset: string | null | undefined,
): number | undefined {
    if (!isNil(selectedOffset)) {
        return selectedOffset;
    }
    if (isNil(activeOffset)) {
        return undefined;
    }
    return safeParseNumber(activeOffset);
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
    // The next offset we want to scroll to once the table is ready.
    // Seeded from the URL on first render, written by scrollToOffset() on cross-page
    // navigation, and resolved from the probe response when shouldResolveFirstMessage
    // is set. Cleared only after a successful scroll so effect re-runs don't lose it.
    const pendingTarget = React.useRef<number | undefined>(
        getInitialTarget(selectedOffset, activeOffset),
    );

    // When selectedOffset/startTimestamp change *after mount*, the actual target is
    // the first message from the probe response; we resolve it inside the data effect
    // once data arrives. We must NOT flip this on mount — pendingTarget is already
    // seeded from the URL via getInitialTarget(), and overwriting it here would
    // discard the user's URL-specified offset (e.g. an offset that points into a
    // sparse partition where the first available message has a different offset).
    //
    // We compare against previous values stored in refs rather than using a
    // didMount guard, because refs persist across React 18 Strict Mode's double
    // effect invocation. A didMount guard would be flipped to `true` on the first
    // run and then trigger the "after mount" branch on the second run, clobbering
    // the URL-seeded pendingTarget. Both Strict Mode runs see identical initial
    // values, so the equality check correctly returns false on both.
    const shouldResolveFirstMessage = React.useRef(false);
    const prevSelectedOffset = React.useRef(selectedOffset);
    const prevStartTimestamp = React.useRef(startTimestamp);
    React.useEffect(() => {
        if (
            prevSelectedOffset.current === selectedOffset &&
            prevStartTimestamp.current === startTimestamp
        ) {
            return;
        }
        prevSelectedOffset.current = selectedOffset;
        prevStartTimestamp.current = startTimestamp;
        shouldResolveFirstMessage.current = true;
    }, [selectedOffset, startTimestamp]);

    // Reset scroll on page/partition change so the visual transition is clean.
    // Invalidate any pending scroll on partition switch — its offset is meaningless
    // in the new partition.
    //
    // Important: the initial `undefined → <auto-selected>` transition (when the URL
    // omits selectedPartition and useTopicPartitions auto-selects the first one) is
    // NOT a user partition switch — it's the resolution of the same selection. The
    // URL-seeded pendingTarget points into exactly the partition being auto-selected,
    // so we must not clobber it. Only treat the change as a real switch when leaving
    // a previously-defined partition (defined → different defined). The ref-based
    // comparison also survives Strict Mode's double effect invocation: both runs see
    // the same initial `prevPartition.current`, so the guard returns false on both.
    const prevPage = React.useRef(currentPage);
    const prevPartition = React.useRef(selectedPartition);
    React.useLayoutEffect(() => {
        const pageChanged = prevPage.current !== currentPage;
        const partitionChanged = prevPartition.current !== selectedPartition;
        if (!pageChanged && !partitionChanged) {
            return;
        }
        const isRealPartitionSwitch = partitionChanged && !isNil(prevPartition.current);
        prevPage.current = currentPage;
        prevPartition.current = selectedPartition;
        if (isRealPartitionSwitch) {
            pendingTarget.current = undefined;
            shouldResolveFirstMessage.current = false;
        }
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [currentPage, selectedPartition, scrollContainerRef]);

    const scrollToOffset = React.useCallback(
        (newOffset: number) => {
            if (isNil(baseOffset) || isNil(endOffset) || isNil(pageStartOffset)) {
                return;
            }
            if (newOffset < baseOffset || newOffset >= endOffset) {
                return;
            }

            if (usePagination) {
                const targetPage = getTargetPage(newOffset, baseOffset);
                if (targetPage !== currentPage) {
                    // Queue the scroll for after the page switch; the data effect performs it.
                    pendingTarget.current = newOffset;
                    setCurrentPage(targetPage);
                    return;
                }
            }

            const scrollTop = Math.max(0, (newOffset - pageStartOffset) * DEFAULT_TABLE_ROW_HEIGHT);
            scrollContainerRef.current?.scrollTo({top: scrollTop, behavior: 'instant'});
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

    React.useEffect(() => {
        if (isFetching || isNil(baseOffset) || isNil(endOffset) || isNil(pageStartOffset)) {
            return undefined;
        }

        // Resolve "scroll to first message" intent now that the probe response is here.
        if (shouldResolveFirstMessage.current) {
            const firstMessage = currentData?.Messages?.[0];
            if (!isNil(firstMessage)) {
                pendingTarget.current = safeParseNumber(firstMessage.Offset);
                shouldResolveFirstMessage.current = false;
            }
        }

        const target = pendingTarget.current;
        if (isNil(target)) {
            return undefined;
        }

        if (target < baseOffset || target >= endOffset) {
            pendingTarget.current = undefined;
            return undefined;
        }

        // Target is on a different page — switch pages; pendingTarget stays set,
        // and the next effect run (after page change) will perform the actual scroll.
        if (usePagination) {
            const targetPage = getTargetPage(target, baseOffset);
            if (targetPage !== currentPage) {
                setCurrentPage(targetPage);
                return undefined;
            }
        }

        const container = scrollContainerRef.current;
        const tableEl = container?.querySelector('table');
        if (!container || !tableEl) {
            return undefined;
        }
        const targetScrollTop = Math.max(0, (target - pageStartOffset) * DEFAULT_TABLE_ROW_HEIGHT);

        // Wait for the table to reflect the current page's content before scrolling.
        // Reading scrollHeight synchronously here is unsafe: React may have committed
        // a new currentPage but PaginatedTable's chunk renderer hasn't yet recomputed
        // separator-row heights, so scrollHeight could still describe the previous
        // page's layout. ResizeObserver delivers its first callback after the next
        // layout flush, guaranteeing we measure the fresh DOM, and fires again on
        // every subsequent growth (chunk fetches expanding the virtual height).
        const observer = new ResizeObserver(() => {
            // Wait until the target row itself is laid out. We can't require a full
            // viewport of content below it: when the target sits in the last viewport
            // of a paginated page, there isn't one, and scrollHeight will never reach
            // targetScrollTop + clientHeight. The browser will clamp scrollTo to the
            // maximum scroll position and still reveal the row.
            //
            // Exception: if the content is already shorter than the target offset
            // (targetScrollTop > maxScrollTop), the row will never appear at the
            // expected position no matter how long we wait — the table is simply
            // too short (few rows, non-paginated mode, short last page, etc.).
            // In that case, clamp to the end, clear the pending target and stop
            // observing, otherwise pendingTarget stays set across effect re-runs.
            const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
            const rowLaidOut = container.scrollHeight >= targetScrollTop + DEFAULT_TABLE_ROW_HEIGHT;
            const targetReachable = targetScrollTop <= maxScrollTop;
            if (!rowLaidOut && !targetReachable) {
                return;
            }
            container.scrollTo({
                top: Math.min(targetScrollTop, maxScrollTop),
                behavior: 'instant',
            });
            if (pendingTarget.current === target) {
                pendingTarget.current = undefined;
            }
            observer.disconnect();
        });
        observer.observe(tableEl);
        return () => observer.disconnect();
    }, [
        currentData,
        isFetching,
        baseOffset,
        endOffset,
        pageStartOffset,
        usePagination,
        currentPage,
        setCurrentPage,
        scrollContainerRef,
    ]);

    return {scrollToOffset};
}
