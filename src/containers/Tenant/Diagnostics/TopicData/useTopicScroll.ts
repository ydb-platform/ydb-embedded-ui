import React from 'react';

import {isNil} from 'lodash';

import {DEFAULT_TABLE_ROW_HEIGHT} from '../../../../components/PaginatedTable';
import type {TopicDataResponse} from '../../../../types/api/topic';
import {isNumeric} from '../../../../utils/utils';

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

// ---------------------------------------------------------------------------
// Scroll intent model
// ---------------------------------------------------------------------------
//
// The hook tracks one atomic intent describing where the table should scroll
// next. Every trigger (URL filter change, user click, partition/page switch)
// produces a complete replacement intent — there's no second flag to forget
// to reset.
//
//   - filter-probe: a URL filter (selectedOffset or startTimestamp) is active
//                   and the probe query is authoritative for the target. The
//                   actual offset comes from the probe's first message; the
//                   filter value itself is not used as a target. This handles
//                   sparse partitions and stale URLs uniformly: the backend
//                   returns the first existing message at/after the filter.
//
//   - direct-offset: an absolute offset to scroll to, known without needing
//                    the probe. Two sources:
//                      * 'user' — explicit scrollToOffset() call. Out-of-range
//                                 values are clamped to the nearest boundary.
//                      * 'active-offset' — URL has only activeOffset (no
//                                 selectedOffset, no startTimestamp). The
//                                 probe query is skipped in this case, so we
//                                 can't resolve via probe; fall back to clamp.
//
//   - none: nothing to do.

type ScrollIntent =
    | {kind: 'none'}
    | {
          kind: 'filter-probe';
          source: 'selected-offset' | 'timestamp';
          // For selected-offset: the explicit offset the user pinned in the URL,
          // used as a fallback target when the probe returns no message (e.g. the
          // offset is out of range — probe errors out — but we still want the
          // table to scroll to the requested position, clamped to bounds).
          // For timestamp: no fallback offset is available.
          fallbackOffset?: number;
      }
    | {kind: 'direct-offset'; offset: number; origin: 'user' | 'active-offset'};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Page (1-based) that contains the given absolute offset, given the partition's base offset. */
function getTargetPage(offset: number, baseOffset: number): number {
    return Math.floor((offset - baseOffset) / TOPIC_DATA_DEFAULT_PAGE_SIZE) + 1;
}

/**
 * Derive the scroll intent expressed by URL filter params at mount time.
 *
 * Priority:
 *   1. activeOffset — highest, but only honoured at mount. After mount,
 *      activeOffset changes come from in-table clicks on already-visible rows;
 *      scrolling to them would be jarring. Mount-time activeOffset comes from
 *      a deep-link, which is what should drive the initial scroll.
 *   2. startTimestamp — mirrors the probe query's own priority over selectedOffset
 *      ({@link useTopicProbeQuery} sets read_timestamp and ignores offset when both are set).
 *   3. selectedOffset — falls back to probe resolution.
 */
function getInitialIntent(
    selectedOffset: number | null | undefined,
    startTimestamp: number | null | undefined,
    activeOffset: string | null | undefined,
): ScrollIntent {
    if (!isNil(activeOffset) && isNumeric(activeOffset)) {
        return {kind: 'direct-offset', offset: Number(activeOffset), origin: 'active-offset'};
    }
    if (!isNil(startTimestamp)) {
        return {kind: 'filter-probe', source: 'timestamp'};
    }
    if (!isNil(selectedOffset)) {
        return {
            kind: 'filter-probe',
            source: 'selected-offset',
            fallbackOffset: selectedOffset,
        };
    }
    return {kind: 'none'};
}

/**
 * Derive the scroll intent from a *post-mount* filter change. activeOffset is
 * intentionally excluded — clicks on table rows update activeOffset but the row
 * is already on-screen, so re-scrolling would be jarring.
 */
function getFilterChangeIntent(
    selectedOffset: number | null | undefined,
    startTimestamp: number | null | undefined,
): ScrollIntent {
    if (!isNil(startTimestamp)) {
        return {kind: 'filter-probe', source: 'timestamp'};
    }
    if (!isNil(selectedOffset)) {
        return {
            kind: 'filter-probe',
            source: 'selected-offset',
            fallbackOffset: selectedOffset,
        };
    }
    return {kind: 'none'};
}

/** Read the first message's offset from a probe response, if any. */
function getProbeOffset(currentData: TopicDataResponse | undefined): number | undefined {
    const offset = currentData?.Messages?.[0]?.Offset;
    return isNumeric(offset) ? Number(offset) : undefined;
}

/**
 * Clamp an explicit offset into the partition's [baseOffset, endOffset) window.
 * Returns undefined when the window is empty.
 */
function clampOffsetToBounds(
    offset: number,
    baseOffset: number,
    endOffset: number,
): number | undefined {
    if (endOffset <= baseOffset) {
        return undefined;
    }
    if (offset < baseOffset) {
        return baseOffset;
    }
    if (offset >= endOffset) {
        return endOffset - 1;
    }
    return offset;
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
    // Single atomic intent. Seeded from the URL on first render so that an
    // immediate filter-probe / activeOffset URL is honoured even before any
    // effect runs.
    const scrollIntentRef = React.useRef<ScrollIntent>(
        getInitialIntent(selectedOffset, startTimestamp, activeOffset),
    );

    // Track previous filter values via refs (not state) for two reasons:
    //   1. Updating them must not re-render.
    //   2. Refs persist across React 18 Strict Mode's double effect invocation,
    //      so the equality check correctly returns false on both runs (both
    //      runs see the same initial values).
    //
    // activeOffset is deliberately NOT tracked here: post-mount changes to it
    // come from clicking already-visible rows in the table (the click writes
    // activeOffset into the URL to open the drawer). Triggering a scroll on
    // those would yank the user away from the row they just clicked. Initial
    // mount-time activeOffset (from a shared deep-link) is still honoured —
    // it's seeded into scrollIntentRef above.
    const prevSelectedOffset = React.useRef(selectedOffset);
    const prevStartTimestamp = React.useRef(startTimestamp);

    React.useEffect(() => {
        const filtersChanged =
            prevSelectedOffset.current !== selectedOffset ||
            prevStartTimestamp.current !== startTimestamp;
        if (!filtersChanged) {
            return;
        }
        prevSelectedOffset.current = selectedOffset;
        prevStartTimestamp.current = startTimestamp;
        // Atomically replace any in-flight intent — the user just expressed a
        // new filter selection, so any prior target (whether a stale probe
        // resolve or a pending user scroll) is now obsolete by definition.
        scrollIntentRef.current = getFilterChangeIntent(selectedOffset, startTimestamp);
    }, [selectedOffset, startTimestamp]);

    // ---------------------------------------------------------------------------
    // Partition / page change handling
    // ---------------------------------------------------------------------------
    //
    // Reset scroll on page/partition change so the visual transition is clean.
    //
    // Distinguishing user vs programmatic page switches:
    //   When the data effect resolves a filter-probe or direct-offset intent
    //   and the target lives on a different page, it calls setCurrentPage()
    //   AND sets `expectedPageSwitchRef.current = true`. The layout effect
    //   below reads-and-clears that flag, so any page change without the flag
    //   set is treated as a user-driven navigation that must cancel the
    //   pending intent.
    //
    // Partition handling:
    //   The initial `undefined → <auto-selected>` transition (URL omits the
    //   partition, useTopicPartitions auto-selects the first) is NOT a user
    //   partition switch — the URL-seeded intent points into exactly that
    //   partition. Only treat the change as a real switch when leaving a
    //   previously-defined partition (defined → different defined).
    const prevPage = React.useRef(currentPage);
    const prevPartition = React.useRef(selectedPartition);
    const expectedPageSwitchRef = React.useRef(false);
    React.useLayoutEffect(() => {
        const pageChanged = prevPage.current !== currentPage;
        const partitionChanged = prevPartition.current !== selectedPartition;
        if (!pageChanged && !partitionChanged) {
            return;
        }
        const isRealPartitionSwitch = partitionChanged && !isNil(prevPartition.current);
        const isExpectedPageSwitch = pageChanged && expectedPageSwitchRef.current;
        expectedPageSwitchRef.current = false;
        prevPage.current = currentPage;
        prevPartition.current = selectedPartition;

        if (isRealPartitionSwitch) {
            // New partition — any offset from the previous partition is meaningless.
            scrollIntentRef.current = {kind: 'none'};
        } else if (pageChanged && !isExpectedPageSwitch) {
            // User-driven page switch (pagination control, keyboard, etc.) while
            // an intent was still pending — cancel it so the in-flight filter
            // probe (or queued direct target) doesn't yank the user away from
            // the page they just navigated to.
            scrollIntentRef.current = {kind: 'none'};
        }

        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [currentPage, selectedPartition, scrollContainerRef]);

    // ---------------------------------------------------------------------------
    // Imperative user scroll
    // ---------------------------------------------------------------------------
    //
    // Any explicit scrollToOffset() replaces the intent atomically. This:
    //   - cancels a pending filter-probe so a late-arriving probe response
    //     cannot overwrite the user's target;
    //   - applies bounds clamping (out-of-range becomes nearest boundary
    //     instead of silently doing nothing);
    //   - delegates the actual scroll to the data effect so the page-switch /
    //     ResizeObserver logic is in one place.
    const scrollToOffset = React.useCallback(
        (newOffset: number) => {
            if (isNil(baseOffset) || isNil(endOffset)) {
                return;
            }
            const clamped = clampOffsetToBounds(newOffset, baseOffset, endOffset);
            if (isNil(clamped)) {
                scrollIntentRef.current = {kind: 'none'};
                return;
            }
            scrollIntentRef.current = {kind: 'direct-offset', offset: clamped, origin: 'user'};

            // Same-page targets can avoid a re-render; cross-page targets need
            // setCurrentPage, which the data effect will pick up. We still go
            // through the data effect so that ResizeObserver waits for the
            // table to be laid out before scrolling, identical to filter-probe
            // resolution. Trigger an immediate effect re-run by bumping a
            // dummy state? No — currentData/isFetching haven't changed, so
            // the existing data-effect dependencies wouldn't fire. For the
            // same-page case we can scroll synchronously here; for the cross-
            // page case we queue the page switch and let the effect handle it.
            if (isNil(pageStartOffset)) {
                return;
            }
            if (usePagination) {
                const targetPage = getTargetPage(clamped, baseOffset);
                if (targetPage !== currentPage) {
                    expectedPageSwitchRef.current = true;
                    setCurrentPage(targetPage);
                    return;
                }
            }
            const scrollTop = Math.max(0, (clamped - pageStartOffset) * DEFAULT_TABLE_ROW_HEIGHT);
            scrollContainerRef.current?.scrollTo({top: scrollTop, behavior: 'instant'});
            // Same-page scroll completed — clear intent so a later probe
            // response cannot reinterpret it.
            if (
                scrollIntentRef.current.kind === 'direct-offset' &&
                scrollIntentRef.current.offset === clamped &&
                scrollIntentRef.current.origin === 'user'
            ) {
                scrollIntentRef.current = {kind: 'none'};
            }
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

    // ---------------------------------------------------------------------------
    // Intent resolution effect
    // ---------------------------------------------------------------------------
    //
    // Runs whenever data or layout-relevant inputs change. Resolves the current
    // intent into a concrete scroll, switching pages first if needed and
    // waiting for the table DOM via ResizeObserver before performing the
    // actual scrollTo.
    React.useEffect(() => {
        if (isNil(baseOffset) || isNil(endOffset) || isNil(pageStartOffset)) {
            return undefined;
        }
        const intent = scrollIntentRef.current;
        if (intent.kind === 'none') {
            return undefined;
        }

        // Resolve intent → concrete target offset.
        let target: number | undefined;
        if (intent.kind === 'filter-probe') {
            // Probe is authoritative. Wait for the probe response; while it's
            // in flight do nothing (next data update will re-run this effect).
            if (isFetching) {
                return undefined;
            }
            const probeOffset = getProbeOffset(currentData);
            if (!isNil(probeOffset)) {
                target = clampOffsetToBounds(probeOffset, baseOffset, endOffset);
            } else if (isNil(intent.fallbackOffset)) {
                // Timestamp-only filter with empty probe response — nothing to
                // scroll to. Drop the intent so we don't spin re-evaluating it.
                scrollIntentRef.current = {kind: 'none'};
                return undefined;
            } else {
                // Probe returned no message (e.g. selectedOffset is out of range
                // and the backend errored). The user still pinned an explicit
                // offset in the URL — scroll to the nearest valid position so
                // the navigation isn't silently dropped.
                target = clampOffsetToBounds(intent.fallbackOffset, baseOffset, endOffset);
            }
        } else {
            // direct-offset: already clamped at intent creation, but bounds may
            // have moved (probe response shifted base/end), so reclamp.
            target = clampOffsetToBounds(intent.offset, baseOffset, endOffset);
        }

        if (isNil(target)) {
            scrollIntentRef.current = {kind: 'none'};
            return undefined;
        }

        // Page switch if needed. Mark it expected so the layout effect doesn't
        // cancel the intent. `pendingTarget` lives entirely inside the intent
        // ref, so there's nothing else to thread through.
        if (usePagination) {
            const targetPage = getTargetPage(target, baseOffset);
            if (targetPage !== currentPage) {
                expectedPageSwitchRef.current = true;
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

        // Capture the intent identity at observer creation so a later atomic
        // replacement (user click, partition switch, filter change) doesn't
        // get its new intent prematurely cleared by this observer's callback.
        const observedIntent = intent;

        // Wait for the table to reflect the current page's content before scrolling.
        // Reading scrollHeight synchronously here is unsafe: React may have committed
        // a new currentPage but PaginatedTable's chunk renderer hasn't yet recomputed
        // separator-row heights, so scrollHeight could still describe the previous
        // page's layout. ResizeObserver delivers its first callback after the next
        // layout flush, guaranteeing we measure the fresh DOM, and fires again on
        // every subsequent growth (chunk fetches expanding the virtual height).
        const observer = new ResizeObserver(() => {
            // If the intent we were resolving has been superseded (user click,
            // new filter, partition switch, user page switch), abandon this
            // scroll entirely — don't move the viewport based on a stale target.
            // Reference equality is sufficient because intent replacements are
            // always whole-object writes.
            if (scrollIntentRef.current !== observedIntent) {
                observer.disconnect();
                return;
            }
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
            // In that case, clamp to the end, clear the intent and stop observing.
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
            scrollIntentRef.current = {kind: 'none'};
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
