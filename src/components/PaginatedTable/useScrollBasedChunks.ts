import React from 'react';

import {throttle} from 'lodash';

interface UseScrollBasedChunksProps {
    containerRef: React.RefObject<HTMLElement> | null;
    totalItems: number;
    itemHeight: number;
    chunkSize: number;
}

const THROTTLING_TIMEOUT = 100;

export const useScrollBasedChunks = ({
    containerRef,
    totalItems,
    itemHeight,
    chunkSize,
}: UseScrollBasedChunksProps) => {
    const [activeChunks, setActiveChunks] = React.useState<number[]>([0]);

    const handleScroll = React.useCallback(() => {
        if (!containerRef?.current) {
            return;
        }

        const {scrollTop, clientHeight} = containerRef.current;

        const visibleStartIndex = Math.floor(scrollTop / itemHeight);
        const visibleEndIndex = Math.min(
            Math.ceil((scrollTop + clientHeight) / itemHeight),
            Math.max(totalItems - 1, 0),
        );

        const startChunk = Math.floor(visibleStartIndex / chunkSize);
        const endChunk = Math.floor(visibleEndIndex / chunkSize);

        const newActiveChunks = Array.from(
            {length: endChunk - startChunk + 1},
            (_, index) => startChunk + index,
        );

        setActiveChunks(newActiveChunks);
    }, [chunkSize, containerRef, itemHeight, totalItems]);

    React.useEffect(() => {
        const containerElement = containerRef?.current;
        if (!containerElement) {
            return undefined;
        }

        const throttledHandleScroll = throttle(handleScroll, THROTTLING_TIMEOUT);
        containerElement.addEventListener('scroll', throttledHandleScroll);

        return () => {
            containerElement.removeEventListener('scroll', throttledHandleScroll);
        };
    }, [containerRef, handleScroll]);

    return activeChunks;
};
