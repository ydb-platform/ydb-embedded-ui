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

export interface VisibleRange {
    startChunk: number;
    endChunk: number;
    startRow: number;
    endRow: number;
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
}: UseScrollBasedChunksProps): [boolean[], VisibleRange] => {
    const chunksCount = React.useMemo(
        () => Math.ceil(totalItems / chunkSize),
        [chunkSize, totalItems],
    );

    const [startChunk, setStartChunk] = React.useState(0);
    const [endChunk, setEndChunk] = React.useState(
        Math.min(overscanCount, Math.max(chunksCount - 1, 0)),
    );

    // Track exact visible rows (not just chunks)
    const [startRow, setStartRow] = React.useState(0);
    const [endRow, setEndRow] = React.useState(
        Math.min(overscanCount * chunkSize, Math.max(totalItems - 1, 0)),
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

        // Calculate visible chunks (with overscan)
        const startChunk = Math.max(
            Math.floor(visibleStart / rowHeight / chunkSize) - overscanCount,
            0,
        );
        const endChunk = Math.min(
            Math.floor(visibleEnd / rowHeight / chunkSize) + overscanCount,
            Math.max(chunksCount - 1, 0),
        );

        // Calculate visible rows (more precise)
        const startRowIndex = Math.max(Math.floor(visibleStart / rowHeight), 0);
        const endRowIndex = Math.min(
            Math.floor(visibleEnd / rowHeight),
            Math.max(totalItems - 1, 0),
        );

        return {
            start: startChunk,
            end: endChunk,
            startRow: startRowIndex,
            endRow: endRowIndex,
        };
    }, [parentRef, tableRef, rowHeight, chunkSize, overscanCount, chunksCount]);

    const handleScroll = React.useCallback(() => {
        const newRange = calculateVisibleRange();
        if (newRange) {
            setStartChunk(newRange.start);
            setEndChunk(newRange.end);
            setStartRow(newRange.startRow);
            setEndRow(newRange.endRow);
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

    // Create the visibility information
    const activeChunks = React.useMemo(() => {
        // boolean array that represents active chunks
        const chunks = Array(chunksCount).fill(false);
        for (let i = startChunk; i <= endChunk; i++) {
            chunks[i] = true;
        }
        return chunks;
    }, [chunksCount, startChunk, endChunk]);

    const visibleRange = React.useMemo(() => {
        return {
            startChunk,
            endChunk,
            startRow,
            endRow,
        };
    }, [startChunk, endChunk, startRow, endRow]);

    return [activeChunks, visibleRange];
};
