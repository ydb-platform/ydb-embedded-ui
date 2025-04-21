import React from 'react';

import {throttle} from 'lodash';

import {calculateElementOffsetTop} from './utils';

interface UseScrollBasedChunksProps {
    parentRef: React.RefObject<HTMLElement>;
    tableRef: React.RefObject<HTMLElement>;
    totalItems: number;
    rowHeight: number;
    chunkSize: number;
    overscanCount?: number;
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

    const [startChunk, setStartChunk] = React.useState(0);
    const [endChunk, setEndChunk] = React.useState(
        Math.min(overscanCount, Math.max(chunksCount - 1, 0)),
    );

    const calculateVisibleRange = React.useCallback(() => {
        const container = parentRef?.current;
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
    }, [parentRef, tableRef, rowHeight, chunkSize, overscanCount, chunksCount]);

    React.useEffect(() => {
        const newRange = calculateVisibleRange();

        if (newRange) {
            setStartChunk(newRange.start);
            setEndChunk(newRange.end);
        }
    }, [chunksCount, calculateVisibleRange]);

    const handleScroll = React.useCallback(() => {
        const newRange = calculateVisibleRange();
        if (newRange) {
            setStartChunk(newRange.start);
            setEndChunk(newRange.end);
        }
    }, [calculateVisibleRange]);

    React.useEffect(() => {
        const container = parentRef?.current;
        if (!container) {
            return undefined;
        }

        const throttledHandleScroll = throttle(handleScroll, THROTTLE_DELAY, {
            leading: true,
            trailing: true,
        });

        container.addEventListener('scroll', throttledHandleScroll);
        return () => {
            container.removeEventListener('scroll', throttledHandleScroll);
            throttledHandleScroll.cancel();
        };
    }, [handleScroll, parentRef]);

    return React.useMemo(() => {
        // boolean array that represents active chunks
        const activeChunks = Array(chunksCount).fill(false);
        for (let i = startChunk; i <= Math.min(endChunk, chunksCount); i++) {
            activeChunks[i] = true;
        }
        return activeChunks;
    }, [chunksCount, startChunk, endChunk]);
};
