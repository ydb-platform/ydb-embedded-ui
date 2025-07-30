import React from 'react';

import {debounce} from 'lodash';
import {useHistory} from 'react-router-dom';

const DEBOUNCE_DELAY = 100;

/**
 * Hook for saving and restoring scroll position on navigation
 * Uses sessionStorage to persist scroll position across browser history navigation
 * Only restores position when navigating via browser back/forward buttons
 */
export function useScrollPosition(
    elementRef: React.RefObject<HTMLElement>,
    key: string,
    shouldRestore: boolean,
) {
    const history = useHistory();

    // Save scroll position to sessionStorage
    const saveScrollPosition = React.useCallback(
        (scrollTop: number) => {
            try {
                sessionStorage.setItem(`scroll-${key}`, String(scrollTop));
            } catch (error) {
                // Ignore sessionStorage errors (e.g., in private mode)
                console.warn('Failed to save scroll position:', error);
            }
        },
        [key],
    );

    // Clear scroll position from sessionStorage
    const clearScrollPosition = React.useCallback(() => {
        try {
            sessionStorage.removeItem(`scroll-${key}`);
        } catch (error) {
            // Ignore sessionStorage errors
            console.warn('Failed to clear scroll position:', error);
        }
    }, [key]);

    // Restore scroll position from sessionStorage
    const restoreScrollPosition = React.useCallback(() => {
        if (!elementRef.current) {
            return;
        }

        try {
            const savedPosition = sessionStorage.getItem(`scroll-${key}`);
            if (savedPosition !== null) {
                const scrollTop = parseInt(savedPosition, 10);
                if (!isNaN(scrollTop)) {
                    elementRef.current.scrollTop = scrollTop;
                }
            }
        } catch (error) {
            // Ignore sessionStorage errors
            console.warn('Failed to restore scroll position:', error);
        }
    }, [elementRef, key]);

    // Create debounced save function
    const debouncedSaveScrollPosition = React.useMemo(
        () =>
            debounce((scrollTop: number) => {
                saveScrollPosition(scrollTop);
            }, DEBOUNCE_DELAY),
        [saveScrollPosition],
    );

    // Handle scroll events with debouncing
    const handleScroll = React.useCallback(() => {
        if (!elementRef.current) {
            return;
        }

        debouncedSaveScrollPosition(elementRef.current.scrollTop);
    }, [elementRef, debouncedSaveScrollPosition]);

    // Detect if navigation is via browser back/forward
    const isHistoryNavigation = React.useMemo(() => {
        // Check if this is a browser back/forward navigation
        // React Router v5 doesn't provide direct way to detect this,
        // but we can use history.action to determine the type of navigation
        return history.action === 'POP';
    }, [history.action]);

    // Handle location changes
    React.useLayoutEffect(() => {
        let timeoutId: number | undefined;
        if (isHistoryNavigation && shouldRestore) {
            // This is a browser back/forward navigation - restore position with timeout to ensure that content rendered
            timeoutId = window.setTimeout(restoreScrollPosition, 100);
        } else {
            // This is a regular navigation (tab click, page reload) - clear position
            clearScrollPosition();
        }
        return () => clearTimeout(timeoutId);
    }, [
        isHistoryNavigation,
        restoreScrollPosition,
        clearScrollPosition,
        elementRef,
        shouldRestore,
    ]);

    React.useEffect(() => {
        const element = elementRef.current;
        if (!element) {
            return;
        }

        element.addEventListener('scroll', handleScroll, {passive: true});
        return () => {
            element.removeEventListener('scroll', handleScroll);
            debouncedSaveScrollPosition.cancel();
        };
    }, [handleScroll, debouncedSaveScrollPosition, elementRef]);
}
