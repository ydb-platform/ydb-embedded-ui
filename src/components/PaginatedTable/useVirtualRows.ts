import React from 'react';

import {rafThrottle} from './utils';

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
const DEFAULT_POOL_SIZE = 50; // Number of DOM elements to keep in the pool

/**
 * Hook for row-level virtualization with DOM recycling
 *
 * This hook:
 * 1. Calculates which rows are visible in the viewport
 * 2. Returns a list of virtual rows with their positions
 * 3. Manages a pool of reusable DOM elements
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

    // Store the DOM element pool for recycling
    const rowPoolRef = React.useRef<Map<number, HTMLElement>>(new Map());

    // Store the total height of all rows for proper scrolling
    const totalHeight = totalItems * rowHeight;

    // Calculate the visible range of rows based on scroll position
    const calculateVisibleRange = React.useCallback(() => {
        const container = scrollContainerRef?.current;
        const table = tableRef.current;

        if (!container || !table) {
            return null;
        }

        // Calculate the offset of the table relative to the scroll container
        let tableOffset = 0;
        let element: HTMLElement | null = table;

        while (element && element !== container) {
            tableOffset += element.offsetTop;
            element = element.offsetParent as HTMLElement;
        }

        // Calculate the visible range
        const scrollTop = container.scrollTop;
        const visibleStart = Math.max(scrollTop - tableOffset, 0);
        const visibleEnd = visibleStart + container.clientHeight;

        // Convert scroll position to row indices
        const startIndex = Math.max(Math.floor(visibleStart / rowHeight) - overscanCount, 0);
        const endIndex = Math.min(
            Math.ceil(visibleEnd / rowHeight) + overscanCount,
            totalItems - 1,
        );

        return {startIndex, endIndex};
    }, [scrollContainerRef, tableRef, rowHeight, overscanCount, totalItems]);

    // Update the visible range when scrolling
    const updateVisibleRange = React.useCallback(() => {
        const newRange = calculateVisibleRange();
        if (newRange) {
            setVisibleRange(newRange);
        }
    }, [calculateVisibleRange]);

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

    // Get or create a DOM element for a row
    const getRowElement = React.useCallback(
        (index: number): HTMLElement => {
            // Check if we already have an element for this row
            if (rowPoolRef.current.has(index)) {
                return rowPoolRef.current.get(index)!;
            }

            // If the pool is full, recycle the least recently used element
            if (rowPoolRef.current.size >= DEFAULT_POOL_SIZE) {
                // Find a row that's not currently visible
                for (const [poolIndex] of rowPoolRef.current) {
                    if (poolIndex < visibleRange.startIndex || poolIndex > visibleRange.endIndex) {
                        const element = rowPoolRef.current.get(poolIndex)!;
                        rowPoolRef.current.delete(poolIndex);
                        rowPoolRef.current.set(index, element);
                        return element;
                    }
                }

                // If all rows in the pool are visible, create a new element
                const element = document.createElement('tr');
                rowPoolRef.current.set(index, element);
                return element;
            }

            // Create a new element if the pool isn't full
            const element = document.createElement('tr');
            rowPoolRef.current.set(index, element);
            return element;
        },
        [visibleRange.startIndex, visibleRange.endIndex],
    );

    return {
        virtualRows,
        totalHeight,
        getRowElement,
        visibleRange,
    };
};
