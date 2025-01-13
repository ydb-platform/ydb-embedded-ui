import React from 'react';

interface UseInfiniteScrollProps {
    containerRef: React.RefObject<HTMLElement>;
    onLoadMore: () => Promise<void>;
    hasNextPage: boolean;
    isLoading: boolean;
    threshold?: number;
}

export function useInfiniteScroll({
    containerRef,
    onLoadMore,
    hasNextPage,
    isLoading,
    threshold = 50,
}: UseInfiniteScrollProps) {
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => {
            const {scrollTop, scrollHeight, clientHeight} = container;
            const scrollBottom = scrollHeight - scrollTop - clientHeight;

            if (scrollBottom < threshold && !isLoading && hasNextPage) {
                onLoadMore();
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [containerRef, onLoadMore, hasNextPage, isLoading, threshold]);
}
