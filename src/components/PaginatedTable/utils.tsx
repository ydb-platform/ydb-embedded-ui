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
 * Calculates the total vertical offset (distance from top) of an element relative to its container
 * or the document body if no container is specified.
 *
 * This function traverses up through the DOM tree, accumulating offsetTop values
 * from each parent element until it reaches either the specified container or
 * the top of the document.
 *
 * @param element - The HTML element to calculate the offset for
 * @param container - Optional container element to stop the calculation at
 * @returns The total vertical offset in pixels
 *
 * Example:
 * const offset = calculateElementOffsetTop(myElement, myContainer);
 * // Returns the distance in pixels from myElement to the top of myContainer
 */
export function calculateElementOffsetTop(element: HTMLElement, container?: HTMLElement): number {
    let currentElement = element;
    let offsetTop = 0;

    while (currentElement && currentElement !== container) {
        offsetTop += currentElement.offsetTop;
        currentElement = currentElement.offsetParent as HTMLElement;
    }

    return offsetTop;
}

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
