import React from 'react';

import {calculateVisibleRange, rafThrottle} from './utils';

interface UseVirtualRowsProps {
    scrollContainerRef: React.RefObject<HTMLElement>;
    tableRef: React.RefObject<HTMLElement>;
    totalItems: number;
    rowHeight: number;
    overscanCount?: number;
}

interface VirtualRow {
    index: number;
    top: number;
}

const DEFAULT_OVERSCAN_COUNT = 5;

/**
 * Hook for row-level virtualization
 *
 * This hook:
 * 1. Calculates which rows are visible in the viewport
 * 2. Returns a list of virtual rows with their positions
 */
export const useVirtualRows = ({
    scrollContainerRef,
    tableRef,
    totalItems,
    rowHeight,
    overscanCount = DEFAULT_OVERSCAN_COUNT,
}: UseVirtualRowsProps) => {
    // Store the visible range of rows
    const [visibleRange, setVisibleRange] = React.useState({
        startIndex: 0,
        endIndex: Math.min(overscanCount * 2, totalItems - 1),
    });

    // Store the total height of all rows for proper scrolling
    const totalHeight = totalItems * rowHeight;

    // Update the visible range when scrolling
    const updateVisibleRange = React.useCallback(() => {
        const newRange = calculateVisibleRange(
            scrollContainerRef,
            tableRef,
            rowHeight,
            overscanCount,
            totalItems,
        );
        if (newRange) {
            setVisibleRange(newRange);
        }
    }, [scrollContainerRef, tableRef, rowHeight, overscanCount, totalItems]);

    // Initialize and update visible range when dependencies change
    React.useEffect(() => {
        updateVisibleRange();
    }, [totalItems, updateVisibleRange]);

    // Handle scroll events
    React.useEffect(() => {
        const container = scrollContainerRef?.current;
        if (!container) {
            return undefined;
        }

        const throttledHandleScroll = rafThrottle(updateVisibleRange);
        container.addEventListener('scroll', throttledHandleScroll);

        return () => {
            container.removeEventListener('scroll', throttledHandleScroll);
        };
    }, [scrollContainerRef, updateVisibleRange]);

    // Handle window resize events
    React.useEffect(() => {
        const throttledHandleResize = rafThrottle(() => {
            updateVisibleRange();
        });

        window.addEventListener('resize', throttledHandleResize);

        return () => {
            window.removeEventListener('resize', throttledHandleResize);
        };
    }, [updateVisibleRange]);

    // Generate the list of virtual rows
    const virtualRows = React.useMemo(() => {
        const rows: VirtualRow[] = [];

        for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
            if (i >= 0 && i < totalItems) {
                rows.push({
                    index: i,
                    top: i * rowHeight,
                });
            }
        }

        return rows;
    }, [visibleRange.startIndex, visibleRange.endIndex, totalItems, rowHeight]);

    return {
        virtualRows,
        totalHeight,
        visibleRange,
    };
};
