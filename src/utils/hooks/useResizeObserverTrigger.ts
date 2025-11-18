import React from 'react';

/**
 * Triggers a window resize event when dependencies change.
 * Useful for forcing virtualized components to recalculate visible items
 * after layout changes (e.g., when panels expand/collapse).
 *
 * Uses double requestAnimationFrame to ensure the resize event is dispatched
 * after the browser has completed layout recalculation. Properly cleans up
 * all pending RAF callbacks and timeouts on unmount or dependency changes.
 * @param dependencies - Array of values to watch for changes
 * @param timeout - Optional delay in milliseconds before dispatching the resize event (default: 0)
 * @example
 * ```typescript
 * const [isExpanded, setIsExpanded] = useState(false);
 * useResizeObserverTrigger([isExpanded]);
 * ```
 */
export function useResizeObserverTrigger(dependencies: React.DependencyList, timeout = 0): void {
    React.useEffect(() => {
        let rafId2: number | undefined;
        let timeoutId: number | undefined;

        // Use double RAF to ensure layout has been recalculated after animation
        const rafId1 = requestAnimationFrame(() => {
            rafId2 = requestAnimationFrame(() => {
                // Dispatch resize event to trigger virtualization recalculation
                timeoutId = window.setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, timeout);
            });
        });

        return () => {
            cancelAnimationFrame(rafId1);
            if (rafId2 !== undefined) {
                cancelAnimationFrame(rafId2);
            }
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}
