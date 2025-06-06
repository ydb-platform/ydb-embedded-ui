import React from 'react';

import {isEqual} from 'lodash';

import type {KeyValueRow} from '../../../../../types/api/query';

// Type for react-list component
export interface ReactList {
    scrollTo: (index: number) => void;
    scrollAround: (index: number) => void;
    getVisibleRange: () => [number, number];
}

interface UseScrollToSelectedParams {
    selectedRow: KeyValueRow | null | undefined;
    rows: KeyValueRow[] | undefined;
    reactListRef: React.RefObject<ReactList>;
}

/**
 * Custom hook to handle scrolling to selected row in react-list
 * Only scrolls if the selected item is not currently visible
 * When scrolling, positions the item in the middle of the viewport
 */
export function useScrollToSelected({selectedRow, rows, reactListRef}: UseScrollToSelectedParams) {
    React.useEffect(() => {
        if (selectedRow && rows && reactListRef.current) {
            const selectedIndex = rows.findIndex((row) => isEqual(row, selectedRow));
            if (selectedIndex !== -1) {
                const reactList = reactListRef.current;

                try {
                    const visibleRange = reactList.getVisibleRange();
                    const [firstVisible, lastVisible] = visibleRange;

                    // Check if selected item is already visible
                    const isVisible = selectedIndex >= firstVisible && selectedIndex <= lastVisible;

                    if (!isVisible) {
                        reactList.scrollTo(selectedIndex - 1);
                    }
                } catch {
                    // Fallback to scrollAround if getVisibleRange fails
                    reactList.scrollAround(selectedIndex);
                }
            }
        }
    }, [selectedRow, rows, reactListRef]);
}
