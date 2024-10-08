import React from 'react';

import {throttle} from 'lodash';

import {getArray} from '../../utils';

interface UseScrollBasedChunksProps {
    containerRef: React.RefObject<HTMLElement>;
    totalItems: number;
    itemHeight: number;
    chunkSize: number;
}

const THROTTLE_DELAY = 100;

export const useScrollBasedChunks = ({
    containerRef,
    totalItems,
    itemHeight,
    chunkSize,
}: UseScrollBasedChunksProps): number[] => {
    const [activeChunks, setActiveChunks] = React.useState<number[]>([0]);

    const calculateActiveChunks = React.useCallback(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const {scrollTop, clientHeight} = container;
        const visibleStartIndex = Math.floor(scrollTop / itemHeight);
        const visibleEndIndex = Math.min(
            Math.ceil((scrollTop + clientHeight) / itemHeight),
            totalItems - 1,
        );

        const startChunk = Math.floor(visibleStartIndex / chunkSize);
        const endChunk = Math.floor(visibleEndIndex / chunkSize);

        const newActiveChunks = getArray(endChunk - startChunk + 1).map(
            (index) => startChunk + index,
        );

        setActiveChunks(newActiveChunks);
    }, [chunkSize, containerRef, itemHeight, totalItems]);

    const throttledCalculateActiveChunks = React.useMemo(
        () => throttle(calculateActiveChunks, THROTTLE_DELAY),
        [calculateActiveChunks],
    );

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return undefined;
        }

        container.addEventListener('scroll', throttledCalculateActiveChunks);
        return () => {
            container.removeEventListener('scroll', throttledCalculateActiveChunks);
            throttledCalculateActiveChunks.cancel();
        };
    }, [containerRef, throttledCalculateActiveChunks]);

    return activeChunks;
};
