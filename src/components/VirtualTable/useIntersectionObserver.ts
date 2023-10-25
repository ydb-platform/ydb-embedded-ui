import {useEffect, useRef} from 'react';

import type {OnEntry, OnLeave} from './types';

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
            rootMargin: '50%',
        });

        return () => {
            observer.current?.disconnect();
            observer.current = undefined;
        };
    }, [parentContainer, onEntry, onLeave]);

    return observer.current;
};
