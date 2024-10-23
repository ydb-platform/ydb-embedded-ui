import React from 'react';

import {throttle} from 'lodash';

interface UseScrollBasedChunksProps {
    parentRef: React.RefObject<HTMLElement> | null;
    tableRef: React.RefObject<HTMLElement>;
    totalItems: number;
    rowHeight: number;
    chunkSize: number;
    overscanCount?: number;
}

interface ChunksRange {
    start: number;
    end: number;
}

const DEFAULT_OVERSCAN_COUNT = 1;
const THROTTLE_DELAY = 100;

export const useScrollBasedChunks = ({
    parentRef,
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

    const [chunksRange, setChunksRange] = React.useState<ChunksRange>({
        start: 0,
        end: Math.min(overscanCount, chunksCount - 1),
    });

    const calculateVisibleRange = React.useCallback(() => {
        const container = parentRef?.current;
        const table = tableRef.current;
        if (!container || !table) {
            return null;
        }

        const tableOffset = table.offsetTop;
        const containerScroll = container.scrollTop;
        const visibleStart = Math.max(containerScroll - tableOffset, 0);
        const visibleEnd = visibleStart + container.clientHeight;

        const startChunk = Math.max(
            Math.floor(visibleStart / rowHeight / chunkSize) - overscanCount,
            0,
        );
        const endChunk = Math.min(
            Math.floor(visibleEnd / rowHeight / chunkSize) + overscanCount,
            chunksCount - 1,
        );

        return {start: startChunk, end: endChunk};
    }, [parentRef, tableRef, rowHeight, chunkSize, chunksCount, overscanCount]);

    const handleScroll = React.useCallback(() => {
        const newRange = calculateVisibleRange();
        if (
            newRange &&
            (newRange.start !== chunksRange.start || newRange.end !== chunksRange.end)
        ) {
            setChunksRange(newRange);
        }
    }, [calculateVisibleRange, chunksRange.end, chunksRange.start]);

    const throttledHandleScroll = React.useMemo(
        () => throttle(handleScroll, THROTTLE_DELAY, {leading: true, trailing: true}),
        [handleScroll],
    );

    React.useEffect(() => {
        const container = parentRef?.current;
        if (!container) {
            return undefined;
        }

        container.addEventListener('scroll', throttledHandleScroll);
        return () => {
            container.removeEventListener('scroll', throttledHandleScroll);
            throttledHandleScroll.cancel();
        };
    }, [parentRef, throttledHandleScroll]);

    return React.useMemo(() => {
        const activeChunkIds = Array.from(
            {length: chunksRange.end - chunksRange.start + 1},
            (_, i) => chunksRange.start + i,
        );

        // Create boolean array where true represents active chunks
        const activeChunks = Array(chunksCount).fill(false);
        activeChunkIds.forEach((id) => {
            activeChunks[id] = true;
        });

        return activeChunks;
    }, [chunksRange.start, chunksRange.end, chunksCount]);
};
