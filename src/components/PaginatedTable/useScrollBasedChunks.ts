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

const DEFAULT_OVERSCAN_COUNT = 15;

export const useScrollBasedChunks = ({
    scrollContainerRef,
    tableRef,
    totalItems,
    rowHeight,
    chunkSize,
    overscanCount = DEFAULT_OVERSCAN_COUNT,
}: UseScrollBasedChunksProps): {
    visibleRowRange: {start: number; end: number};
    totalItems: number;
} => {
    const chunksCount = React.useMemo(
        () => Math.ceil(totalItems / chunkSize),
        [chunkSize, totalItems],
    );

    const [startRow, setStartRow] = React.useState(0);
    const [endRow, setEndRow] = React.useState(
        Math.min(overscanCount, Math.max(totalItems - 1, 0)),
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

        // Calculate row range first
        const rowStart = Math.max(Math.floor(visibleStart / rowHeight) - overscanCount, 0);
        const rowEnd = Math.min(Math.floor(visibleEnd / rowHeight) + overscanCount, totalItems - 1);

        // Calculate chunk range from row range
        const start = Math.max(Math.floor(rowStart / chunkSize), 0);
        const end = Math.min(Math.floor(rowEnd / chunkSize), Math.max(chunksCount - 1, 0));

        return {start, end, rowStart, rowEnd};
    }, [
        scrollContainerRef,
        tableRef,
        rowHeight,
        chunkSize,
        overscanCount,
        chunksCount,
        totalItems,
    ]);

    const updateVisibleChunks = React.useCallback(() => {
        const newRange = calculateVisibleRange();
        if (newRange) {
            setStartRow(newRange.rowStart);
            setEndRow(newRange.rowEnd);
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
        return {
            visibleRowRange: {start: startRow, end: endRow},
            totalItems,
        };
    }, [startRow, endRow, totalItems]);
};
