import React from 'react';

interface UseTableScrollProps {
    /**
     * Reference to the table container element. This is the element that contains
     * the table and whose position will be adjusted.
     */
    tableContainerRef?: React.RefObject<HTMLDivElement>;

    /**
     * Reference to the scrollable container element. This is the parent element
     * that has scrolling capabilities.
     */
    scrollContainerRef?: React.RefObject<HTMLElement>;

    /**
     * Array of values that, when changed, will trigger the scroll adjustment.
     * Include all values that might affect table height or position to ensure
     * proper scroll adjustment (e.g., filters, sorting, pagination state).
     */
    dependencies?: unknown[];
}

/**
 * A hook that manages scrolling behavior for tables within a scrollable container.
 *
 * This hook ensures proper positioning of tables when their content changes,
 * particularly when using sticky headers, by automatically adjusting the scroll position.
 * It reads the `--data-table-sticky-header-offset` CSS variable from the table container
 * to determine the sticky header offset for correct positioning.
 *
 * The scroll adjustment is triggered whenever any of the dependencies change,
 * but is skipped on the first render to prevent unwanted initial scrolling.
 *
 *
 * @param props - The hook parameters
 * @returns An object containing the handleTableScroll function that can be called manually
 */
export const useTableScroll = ({
    tableContainerRef,
    scrollContainerRef,
    dependencies = [],
}: UseTableScrollProps) => {
    /**
     * Retrieves the sticky header offset from CSS variables.
     *
     * Reads the `--data-table-sticky-header-offset` CSS variable from the table container
     * element and converts it to a number. This value is used to adjust the scroll position
     * to account for sticky headers.
     *
     * @returns The sticky header offset in pixels, or 0 if not defined
     */
    const getStickyTopOffset = React.useCallback(() => {
        // Try to get the variable from parent elements
        if (tableContainerRef?.current) {
            const computedStyle = window.getComputedStyle(tableContainerRef.current);
            // Read the sticky header offset variable for correct scroll positioning
            const stickyTopOffset = computedStyle.getPropertyValue(
                '--data-table-sticky-header-offset',
            );

            return stickyTopOffset ? parseInt(stickyTopOffset, 10) : 0;
        }
        return 0;
    }, [tableContainerRef]);

    /**
     * Adjusts the scroll position of the container to properly position the table.
     *
     * This function calculates the correct scroll position based on:
     * - The relative position of the table within the scroll container
     * - The sticky header offset (if any)
     *
     * It only adjusts the scroll position if the table would be partially hidden
     * behind the sticky header.
     */
    const handleTableScroll = React.useCallback(() => {
        // Only proceed if both refs and their current properties are available
        if (tableContainerRef?.current && scrollContainerRef?.current) {
            // Get the sticky top offset value
            const stickyTopOffset = getStickyTopOffset();

            // Scroll the parent container to the position of the table container
            const tableRect = tableContainerRef.current.getBoundingClientRect();
            const scrollContainerRect = scrollContainerRef.current.getBoundingClientRect();
            const scrollTop =
                tableRect.top - scrollContainerRect.top + scrollContainerRef.current.scrollTop;
            if (tableRect.top - stickyTopOffset < scrollContainerRect.top) {
                // Adjust scroll position to account for sticky offset
                scrollContainerRef.current.scrollTo(0, scrollTop - stickyTopOffset);
            }
        }
    }, [scrollContainerRef, tableContainerRef, getStickyTopOffset]);

    /**
     * Triggers the scroll adjustment when dependencies change.
     *
     * Uses useLayoutEffect to adjust the scroll position before browser paint,
     * preventing visual jumps. The adjustment is only performed if both refs
     * are available.
     */
    React.useLayoutEffect(() => {
        // Only proceed if both refs are available
        if (!tableContainerRef || !scrollContainerRef) {
            return;
        }

        // Only scroll on subsequent renders when dependencies change
        handleTableScroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleTableScroll, tableContainerRef, scrollContainerRef, ...dependencies]);

    return {
        /**
         * Function to manually trigger the table scroll adjustment.
         * This can be useful in cases where you need to adjust the scroll
         * position outside of the dependency changes.
         */
        handleTableScroll,
    };
};
