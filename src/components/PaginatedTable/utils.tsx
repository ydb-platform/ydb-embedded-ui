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
 * Computes the current vertical offset of a table element relative to a scrollable container.
 * Uses DOMRects to calculate the distance from the table's top edge to the container's top edge
 * in container scroll coordinates: tableRect.top - containerRect.top + container.scrollTop.
 * @param container The scrollable container element
 * @param table The table (or table wrapper) element whose offset is calculated
 * @returns The vertical offset in pixels
 */
export function getCurrentTableOffset(container: HTMLElement, table: HTMLElement): number {
    const tableRect = table.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return tableRect.top - containerRect.top + container.scrollTop;
}

/**
 * Returns whether a table is considered offscreen relative to the container's viewport
 * with an additional safety margin (freeze margin).
 * A table is offscreen if its vertical span [tableStartY, tableEndY] lies farther than
 * the specified margin outside the viewport [scrollTop, scrollTop + clientHeight].
 * @param params The parameters for the offscreen check
 * @param params.container The scrollable container element
 * @param params.currentTableOffset The current vertical offset of the table within the container
 * @param params.totalItems Total number of rows in the table
 * @param params.rowHeight Fixed row height in pixels
 * @param params.freezeMarginPx Optional additional margin in pixels; defaults to container.clientHeight
 * @returns True if the table is offscreen beyond the margin; otherwise false
 */
export function isTableOffscreen(params: {
    container: HTMLElement;
    currentTableOffset: number;
    totalItems: number;
    rowHeight: number;
    freezeMarginPx?: number;
}): boolean {
    const {container, currentTableOffset, totalItems, rowHeight, freezeMarginPx} = params;
    const tableStartY = currentTableOffset;
    const tableEndY = tableStartY + totalItems * rowHeight;
    const viewportMin = container.scrollTop;
    const viewportMax = viewportMin + container.clientHeight;
    const margin = typeof freezeMarginPx === 'number' ? freezeMarginPx : container.clientHeight;
    return viewportMax < tableStartY - margin || viewportMin > tableEndY + margin;
}
