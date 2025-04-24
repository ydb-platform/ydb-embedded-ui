import React from 'react';

interface UseViewportChunkSizeParams {
    limit: number | 'viewport';
    parentRef: React.RefObject<HTMLElement>;
    rowHeight: number;
    defaultChunkSize?: number;
}

/**
 * Hook that calculates the number of rows that can fit in the viewport
 * Returns calculated chunk size based on viewport height or the provided limit if it's a number
 */
export const useViewportChunkSize = ({
    limit,
    parentRef,
    rowHeight,
    defaultChunkSize = 20,
}: UseViewportChunkSizeParams): number => {
    // State to store calculated chunk size for viewport mode
    const [calculatedChunkSize, setCalculatedChunkSize] = React.useState(
        typeof limit === 'number' ? limit : defaultChunkSize,
    );

    // Calculate rows that fit in viewport and update when container size changes
    React.useEffect(() => {
        if (limit !== 'viewport' || !parentRef.current) {
            if (typeof limit === 'number') {
                setCalculatedChunkSize(limit);
            }
            return undefined;
        }

        // Store a reference to the current element
        const currentElement = parentRef.current;

        const calculateVisibleRows = () => {
            const viewportHeight = currentElement.clientHeight;
            const visibleRows = Math.floor(viewportHeight / rowHeight);
            setCalculatedChunkSize(Math.max(visibleRows, 1));
        };

        // Calculate initially
        calculateVisibleRows();

        // Set up ResizeObserver to recalculate on parent container size changes
        const resizeObserver = new ResizeObserver(calculateVisibleRows);
        resizeObserver.observe(currentElement);

        return () => {
            // Use the stored reference in the cleanup
            resizeObserver.unobserve(currentElement);
            resizeObserver.disconnect();
        };
    }, [limit, parentRef, rowHeight]);

    // Return the calculated or provided chunk size
    return typeof limit === 'number' ? limit : calculatedChunkSize;
};
