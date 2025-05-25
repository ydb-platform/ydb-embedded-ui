import React from 'react';

// invoke passed function at most once per animation frame
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rafThrottle<Fn extends (...args: any[]) => any>(fn: Fn) {
    let rafId: number | null = null;
    let latestArgs: Parameters<Fn>;

    return function throttled(...args: Parameters<Fn>) {
        // call throttled function with latest args
        latestArgs = args;

        if (typeof rafId === 'number') {
            return;
        }

        rafId = requestAnimationFrame(() => {
            fn(...latestArgs);
            rafId = null;
        });
    };
}

// 40px minWidth so sort icon won't overlap wrapped column title
export function calculateColumnWidth(newWidth: number, minWidth = 40, maxWidth = Infinity) {
    return Math.max(minWidth, Math.min(newWidth, maxWidth));
}

export const typedMemo: <T>(Component: T) => T = React.memo;

/**
 * Calculate the visible range of rows based on scroll position
 */
export const calculateVisibleRange = (
    scrollContainerRef: React.RefObject<HTMLElement>,
    tableRef: React.RefObject<HTMLElement>,
    rowHeight: number,
    overscanCount: number,
    totalItems: number,
) => {
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
    const endIndex = Math.min(Math.ceil(visibleEnd / rowHeight) + overscanCount, totalItems - 1);

    return {startIndex, endIndex};
};
