import React from 'react';

/**
 * Triggers a window resize event when dependencies change.
 * Useful for forcing virtualized components to recalculate visible items
 * after layout changes (e.g., when panels expand/collapse).
 *
 * Uses double requestAnimationFrame to ensure the resize event is dispatched
 * after the browser has completed layout recalculation.
 * @param dependencies - Array of values to watch for changes
 * @example
 * ```typescript
 * const [isExpanded, setIsExpanded] = useState(false);
 * useResizeObserverTrigger([isExpanded]);
 * ```
 */
export function useResizeObserverTrigger(dependencies: React.DependencyList, timeout = 0): void {
    React.useEffect(() => {
        // Use double RAF to ensure layout has been recalculated after animation
        const rafId1 = requestAnimationFrame(() => {
            const rafId2 = requestAnimationFrame(() => {
                // Dispatch resize event to trigger virtualization recalculation
                window.setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, timeout);
            });
            return () => cancelAnimationFrame(rafId2);
        });
        return () => cancelAnimationFrame(rafId1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}
