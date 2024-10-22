import React from 'react';

import {isEqual, throttle} from 'lodash';

import {getArray} from '../../utils';

interface UseScrollBasedChunksProps {
    parentRef?: React.RefObject<HTMLElement>;
    tableRef: React.RefObject<HTMLElement>;
    totalItems: number;
    rowHeight: number;
    chunkSize: number;
}

const THROTTLE_DELAY = 100;
const CHUNKS_AHEAD_COUNT = 1;

export const useScrollBasedChunks = ({
    parentRef,
    tableRef,
    totalItems,
    rowHeight,
    chunkSize,
}: UseScrollBasedChunksProps): number[] => {
    const [activeChunks, setActiveChunks] = React.useState<number[]>(
        getArray(1 + CHUNKS_AHEAD_COUNT).map((index) => index),
    );

    const calculateActiveChunks = React.useCallback(() => {
        const container = parentRef?.current;
        const table = tableRef.current;
        if (!container || !table) {
            return;
        }

        const tableScrollTop = Math.max(container.scrollTop - table.offsetTop, 0);
        const visibleStartIndex = Math.floor(Math.max(tableScrollTop, 0) / rowHeight);
        const visibleEndIndex = Math.min(
            Math.ceil((tableScrollTop + container.clientHeight) / rowHeight),
            totalItems - 1,
        );

        const startChunk = Math.floor(visibleStartIndex / chunkSize);
        const endChunk = Math.floor(visibleEndIndex / chunkSize);

        const newActiveChunks = getArray(endChunk - startChunk + 1 + CHUNKS_AHEAD_COUNT).map(
            (index) => startChunk + index,
        );

        if (!isEqual(activeChunks, newActiveChunks)) {
            setActiveChunks(newActiveChunks);
        }
    }, [parentRef, tableRef, rowHeight, totalItems, chunkSize, activeChunks]);

    const throttledCalculateActiveChunks = React.useMemo(
        () => throttle(calculateActiveChunks, THROTTLE_DELAY),
        [calculateActiveChunks],
    );

    React.useEffect(() => {
        const container = parentRef?.current;
        if (!container) {
            return undefined;
        }

        container.addEventListener('scroll', throttledCalculateActiveChunks);
        return () => {
            container.removeEventListener('scroll', throttledCalculateActiveChunks);
            throttledCalculateActiveChunks.cancel();
        };
    }, [parentRef, throttledCalculateActiveChunks]);

    return activeChunks;
};
