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

export function calculateElementOffsetTop(element: HTMLElement, container?: HTMLElement): number {
    let currentElement = element;
    let offsetTop = 0;

    while (currentElement && currentElement !== container) {
        offsetTop += currentElement.offsetTop;
        currentElement = currentElement.offsetParent as HTMLElement;
    }

    return offsetTop;
}
