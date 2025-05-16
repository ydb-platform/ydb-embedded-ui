import React from 'react';

interface UseTableScrollProps {
    tableContainerRef: React.RefObject<HTMLDivElement>;
    parentRef: React.RefObject<HTMLElement>;
    dependencies?: any[]; // Optional additional dependencies for the effect
}

export const useTableScroll = ({
    tableContainerRef,
    parentRef,
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
        if (tableContainerRef.current && parentRef.current) {
            // Get the sticky top offset value
            const stickyTopOffset = getStickyTopOffset();

            // Scroll the parent container to the position of the table container
            const tableRect = tableContainerRef.current.getBoundingClientRect();
            const parentRect = parentRef.current.getBoundingClientRect();
            const scrollTop = tableRect.top - parentRect.top + parentRef.current.scrollTop;
            if (tableRect.top < parentRect.top) {
                // Adjust scroll position to account for sticky offset
                parentRef.current.scrollTo(0, scrollTop - stickyTopOffset);
            }
        }
    }, [parentRef, tableContainerRef, getStickyTopOffset]);

    // Trigger scroll adjustment with dependencies
    React.useLayoutEffect(() => {
        handleTableScroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleTableScroll, ...dependencies]);

    return {
        handleTableScroll,
    };
};
