import React from 'react';

import {calculateElementOffsetTop, rafThrottle} from './utils';

interface UseScrollBasedChunksProps {
    scrollContainerRef: React.RefObject<HTMLElement>;
    tableRef: React.RefObject<HTMLElement>;
    totalItems: number;
    rowHeight: number;
    chunkSize: number;
    overscanCount?: number;
}

const DEFAULT_OVERSCAN_COUNT = 1;

export const useScrollBasedChunks = ({
    scrollContainerRef,
    tableRef,
    totalItems,
    rowHeight,
    chunkSize,
    overscanCount = DEFAULT_OVERSCAN_COUNT,
}: UseScrollBasedChunksProps): boolean[] => {
    const chunksCount = React.useMemo(
        () => Math.ceil(totalItems / chunkSize),
        [chunkSize, totalItems],
    );

    const [startChunk, setStartChunk] = React.useState(0);
    const [endChunk, setEndChunk] = React.useState(
        Math.min(overscanCount, Math.max(chunksCount - 1, 0)),
    );

    const calculateVisibleRange = React.useCallback(() => {
        const container = scrollContainerRef?.current;
        const table = tableRef.current;
        if (!container || !table) {
            return null;
        }

        const tableOffset = calculateElementOffsetTop(table, container);
        const containerScroll = container.scrollTop;
        const visibleStart = Math.max(containerScroll - tableOffset, 0);
        const visibleEnd = visibleStart + container.clientHeight;

        const start = Math.max(Math.floor(visibleStart / rowHeight / chunkSize) - overscanCount, 0);
        const end = Math.min(
            Math.floor(visibleEnd / rowHeight / chunkSize) + overscanCount,
            Math.max(chunksCount - 1, 0),
        );
        return {start, end};
    }, [scrollContainerRef, tableRef, rowHeight, chunkSize, overscanCount, chunksCount]);

    const updateVisibleChunks = React.useCallback(() => {
        const newRange = calculateVisibleRange();
        if (newRange) {
            setStartChunk(newRange.start);
            setEndChunk(newRange.end);
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

        container.addEventListener('scroll', throttledHandleScroll);
        return () => {
            container.removeEventListener('scroll', throttledHandleScroll);
        };
    }, [handleScroll, scrollContainerRef]);

    return React.useMemo(() => {
        // boolean array that represents active chunks
        const activeChunks = Array(chunksCount).fill(false);
        for (let i = startChunk; i <= endChunk; i++) {
            activeChunks[i] = true;
        }
        return activeChunks;
    }, [chunksCount, startChunk, endChunk]);
};
