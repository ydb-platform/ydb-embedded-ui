import React from 'react';

import {throttle} from 'lodash';

import {getCurrentTableOffset, isTableOffscreen, rafThrottle} from './utils';
interface UseScrollBasedChunksProps {
    scrollContainerRef: React.RefObject<HTMLElement>;
    tableRef: React.RefObject<HTMLElement>;
    totalItems: number;
    rowHeight: number;
    chunkSize: number;
    renderOverscan?: number;
    fetchOverscan?: number;
}

interface ChunkState {
    shouldRender: boolean;
    shouldFetch: boolean;
}

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Bad performance in Safari - reduce overscan counts
const DEFAULT_RENDER_OVERSCAN = isSafari ? 1 : 2;
const DEFAULT_FETCH_OVERSCAN = 4;
const THROTTLE_DELAY = 200;

/**
 * Virtualized chunking for tables within a shared scroll container.
 *
 * Behavior:
 * - Dynamic offset: On scroll/resize, compute the table's current offset relative to the
 *   scroll container using DOM rects. This stays correct as surrounding layout changes.
 * - Visible range: Convert the container viewport [scrollTop, scrollTop+clientHeight]
 *   into table coordinates and derive visible chunk indices from rowHeight and chunkSize.
 * - Offscreen freeze: If the table's [tableStartY, tableEndY] is farther than one viewport
 *   away (freeze margin = container.clientHeight), skip updating the visible chunk range.
 *   This keeps offscreen groups stable and prevents scroll jumps when many groups are open.
 * - Overscan: renderOverscan/fetchOverscan buffer around the visible range to reduce
 *   thrashing (Safari uses smaller render overscan).
 * - Throttling: Scroll updates are throttled (THROTTLE_DELAY), and resize is raf-throttled.
 *
 * Notes:
 * - totalItems/rowHeight changes re-evaluate bounds.
 * - When offscreen, the hook returns skipUpdate to preserve the previous range.
 */
export const useScrollBasedChunks = ({
    scrollContainerRef,
    tableRef,
    totalItems,
    rowHeight,
    chunkSize,
    renderOverscan = DEFAULT_RENDER_OVERSCAN,
    fetchOverscan = DEFAULT_FETCH_OVERSCAN,
}: UseScrollBasedChunksProps): ChunkState[] => {
    const chunksCount = React.useMemo(
        () => Math.ceil(totalItems / chunkSize),
        [chunkSize, totalItems],
    );

    const [visibleStartChunk, setVisibleStartChunk] = React.useState(0);
    const [visibleEndChunk, setVisibleEndChunk] = React.useState(0);

    const calculateVisibleRange = React.useCallback(() => {
        const container = scrollContainerRef?.current;
        const table = tableRef.current;
        if (!container || !table) {
            return null;
        }

        // Compute current table offset relative to the scroll container using DOM rects.
        // This accounts for dynamic layout changes as groups above expand/collapse.
        const currentTableOffset = getCurrentTableOffset(container, table);

        const visibleStart = Math.max(container.scrollTop - currentTableOffset, 0);
        const visibleEnd = visibleStart + container.clientHeight;

        // Determine if this table is far outside of the viewport; if so, freeze updates
        const isOffscreen = isTableOffscreen({
            container,
            currentTableOffset,
            totalItems,
            rowHeight,
        });

        return {
            start: Math.max(Math.floor(visibleStart / rowHeight / chunkSize), 0),
            end: Math.min(
                Math.floor(visibleEnd / rowHeight / chunkSize),
                Math.max(chunksCount - 1, 0),
            ),
            skipUpdate: isOffscreen,
        };
    }, [scrollContainerRef, tableRef, rowHeight, chunkSize, chunksCount, totalItems]);

    const updateVisibleChunks = React.useCallback(() => {
        const newRange = calculateVisibleRange();
        if (newRange) {
            const {start, end, skipUpdate} = newRange;

            if (skipUpdate) {
                return;
            }

            setVisibleStartChunk(start);
            setVisibleEndChunk(end);
        }
    }, [calculateVisibleRange]);

    React.useEffect(() => {
        updateVisibleChunks();
    }, [chunksCount, updateVisibleChunks]);

    const handleScroll = React.useCallback(() => {
        updateVisibleChunks();
    }, [updateVisibleChunks]);

    React.useEffect(() => {
        const throttledHandleZoom = rafThrottle(() => {
            updateVisibleChunks();
        });

        window.addEventListener('resize', throttledHandleZoom);

        return () => {
            window.removeEventListener('resize', throttledHandleZoom);
        };
    }, [updateVisibleChunks]);

    React.useEffect(() => {
        const container = scrollContainerRef?.current;
        if (!container) {
            return undefined;
        }

        const throttledHandleScroll = throttle(handleScroll, THROTTLE_DELAY, {
            trailing: true,
            leading: true,
        });

        container.addEventListener('scroll', throttledHandleScroll, {passive: true});
        return () => {
            container.removeEventListener('scroll', throttledHandleScroll);
        };
    }, [handleScroll, scrollContainerRef]);

    return React.useMemo(() => {
        // Calculate render range (visible + render overscan)
        const renderStartChunk = Math.max(visibleStartChunk - renderOverscan, 0);
        const renderEndChunk = Math.min(
            visibleEndChunk + renderOverscan,
            Math.max(chunksCount - 1, 0),
        );

        // Calculate fetch range (visible + fetch overscan)
        const fetchStartChunk = Math.max(visibleStartChunk - fetchOverscan, 0);
        const fetchEndChunk = Math.min(
            visibleEndChunk + fetchOverscan,
            Math.max(chunksCount - 1, 0),
        );

        // Create chunk states array
        const chunkStates: ChunkState[] = Array(chunksCount)
            .fill(null)
            .map((_, index) => ({
                shouldRender: index >= renderStartChunk && index <= renderEndChunk,
                shouldFetch: index >= fetchStartChunk && index <= fetchEndChunk,
            }));

        return chunkStates;
    }, [chunksCount, visibleStartChunk, visibleEndChunk, renderOverscan, fetchOverscan]);
};
