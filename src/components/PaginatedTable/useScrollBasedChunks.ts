import React from 'react';

import {rafThrottle} from './utils';

interface UseScrollBasedChunksProps {
    scrollContainerRef: React.RefObject<HTMLElement>;
    tableRef: React.RefObject<HTMLElement>;
    totalItems: number;
    rowHeight: number;
    chunkSize: number;
    renderOverscan?: number;
    fetchOverscan?: number;
    tableOffset: number;
}

interface ChunkState {
    shouldRender: boolean;
    shouldFetch: boolean;
}

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Bad performance in Safari - reduce overscan counts
const DEFAULT_RENDER_OVERSCAN = isSafari ? 1 : 2;
const DEFAULT_FETCH_OVERSCAN = 4;

export const useScrollBasedChunks = ({
    scrollContainerRef,
    tableRef,
    totalItems,
    rowHeight,
    chunkSize,
    tableOffset,
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

        const containerScroll = container.scrollTop;
        const visibleStart = Math.max(containerScroll - tableOffset, 0);
        const visibleEnd = visibleStart + container.clientHeight;

        const start = Math.max(Math.floor(visibleStart / rowHeight / chunkSize), 0);
        const end = Math.min(
            Math.floor(visibleEnd / rowHeight / chunkSize),
            Math.max(chunksCount - 1, 0),
        );
        return {start, end};
    }, [scrollContainerRef, tableRef, tableOffset, rowHeight, chunkSize, chunksCount]);

    const updateVisibleChunks = React.useCallback(() => {
        const newRange = calculateVisibleRange();
        if (newRange) {
            setVisibleStartChunk(newRange.start);
            setVisibleEndChunk(newRange.end);
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

        const throttledHandleScroll = rafThrottle(handleScroll);

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
