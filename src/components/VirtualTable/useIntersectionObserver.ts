import {useEffect, useRef} from 'react';

import type {OnEntry, OnLeave} from './types';
import {DEFAULT_INTERSECTION_OBSERVER_MARGIN} from './constants';

interface UseIntersectionObserverProps {
    onEntry: OnEntry;
    onLeave: OnLeave;
    parentContainer?: Element | null;
}

export const useIntersectionObserver = ({
    onEntry,
    onLeave,
    parentContainer,
}: UseIntersectionObserverProps) => {
    const observer = useRef<IntersectionObserver>();

    useEffect(() => {
        const callback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    onEntry(entry.target.id);
                } else {
                    onLeave(entry.target.id);
                }
            });
        };

        observer.current = new IntersectionObserver(callback, {
            root: parentContainer,
            rootMargin: DEFAULT_INTERSECTION_OBSERVER_MARGIN,
        });

        return () => {
            observer.current?.disconnect();
            observer.current = undefined;
        };
    }, [parentContainer, onEntry, onLeave]);

    return observer.current;
};
