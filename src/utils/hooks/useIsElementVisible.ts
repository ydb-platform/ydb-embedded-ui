import {type RefObject, useEffect, useRef, useState} from 'react';

/** Determines, whether element is currently displayd by boundingClientRect */
export const useIsElementVisible = (ref: RefObject<Element>) => {
    const observer = useRef<ResizeObserver>();
    const [isVisible, setIsVisible] = useState<boolean>(false);

    useEffect(() => {
        const callback = (entries: ResizeObserverEntry[]) => {
            entries.forEach((entry) => {
                // Assuming this observer has only one entry
                const rect = entry.target.getBoundingClientRect();
                setIsVisible(rect.height > 0 && rect.width > 0);
            });
        };

        observer.current = new ResizeObserver(callback);

        return () => {
            observer.current?.disconnect();
            observer.current = undefined;
        };
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (el) {
            observer.current?.observe(el);
        }
        return () => {
            if (el) {
                observer.current?.unobserve(el);
            }
        };
    }, [ref]);

    return isVisible;
};
