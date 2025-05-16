import React from 'react';

interface UseTableScrollProps {
    tableContainerRef: React.RefObject<HTMLDivElement>;
    scrollContainerRef: React.RefObject<HTMLElement>;
    dependencies?: any[]; // Optional additional dependencies for the effect
}

export const useTableScroll = ({
    tableContainerRef,
    scrollContainerRef,
    dependencies = [],
}: UseTableScrollProps) => {
    // Get the CSS variable value for sticky top offset
    const getStickyTopOffset = React.useCallback(() => {
        // Try to get the variable from parent elements
        if (tableContainerRef.current) {
            const computedStyle = window.getComputedStyle(tableContainerRef.current);
            const stickyTopOffset = computedStyle.getPropertyValue(
                '--data-table-sticky-top-offset',
            );

            return stickyTopOffset ? parseInt(stickyTopOffset, 10) : 0;
        }
        return 0;
    }, [tableContainerRef]);

    // Handle table scrolling function
    const handleTableScroll = React.useCallback(() => {
        if (tableContainerRef.current && scrollContainerRef.current) {
            // Get the sticky top offset value
            const stickyTopOffset = getStickyTopOffset();

            // Scroll the parent container to the position of the table container
            const tableRect = tableContainerRef.current.getBoundingClientRect();
            const scrollContainerRect = scrollContainerRef.current.getBoundingClientRect();
            const scrollTop =
                tableRect.top - scrollContainerRect.top + scrollContainerRef.current.scrollTop;
            if (tableRect.top < scrollContainerRect.top) {
                // Adjust scroll position to account for sticky offset
                scrollContainerRef.current.scrollTo(0, scrollTop - stickyTopOffset);
            }
        }
    }, [scrollContainerRef, tableContainerRef, getStickyTopOffset]);

    // Trigger scroll adjustment with dependencies
    React.useLayoutEffect(() => {
        handleTableScroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleTableScroll, ...dependencies]);

    return {
        handleTableScroll,
    };
};
