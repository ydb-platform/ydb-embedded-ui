import React from 'react';

import type {History} from 'history';

const HISTORY_STATE_KEY = '__ydbFallbackCanGoBack';

const BackNavigationContext = React.createContext(false);

interface BrowserNavigation extends EventTarget {
    readonly canGoBack: boolean;
}

function getBrowserHistoryState(history: History) {
    const state: unknown = window.history.state;
    if (state !== null && (typeof state !== 'object' || Array.isArray(state))) {
        return undefined;
    }

    const browserState = (state ?? {}) as Record<string, unknown>;
    // A package consumer may supply a history that does not own the browser entry.
    return browserState.key === history.location.key ? browserState : undefined;
}

function readTrackedCanGoBack(history: History) {
    if ('index' in history && typeof history.index === 'number') {
        return history.index > 0;
    }

    return getBrowserHistoryState(history)?.[HISTORY_STATE_KEY] === true;
}

function getBrowserNavigation(history: History) {
    const navigation = (window as Window & {navigation?: BrowserNavigation}).navigation;
    if (!getBrowserHistoryState(history) || typeof navigation?.canGoBack !== 'boolean') {
        return undefined;
    }

    // Older WebKit exposes Navigation without tracking pushState entries.
    // A recorded previous entry must remain reachable after a document reload.
    if (!navigation.canGoBack && readTrackedCanGoBack(history)) {
        return undefined;
    }
    return navigation;
}

function saveTrackedCanGoBack(history: History, canGoBack: boolean) {
    const state = getBrowserHistoryState(history);
    if (state && state[HISTORY_STATE_KEY] !== canGoBack) {
        // Keep router state intact and retain the flag across document reloads.
        window.history.replaceState({...state, [HISTORY_STATE_KEY]: canGoBack}, '');
    }
}

interface BackNavigationProviderProps {
    history: History;
    children: React.ReactNode;
}

export function BackNavigationProvider({history, children}: BackNavigationProviderProps) {
    const [canGoBack, setCanGoBack] = React.useState(
        () => getBrowserNavigation(history)?.canGoBack ?? readTrackedCanGoBack(history),
    );

    React.useLayoutEffect(() => {
        let navigation = getBrowserNavigation(history);
        let currentCanGoBack = navigation?.canGoBack ?? readTrackedCanGoBack(history);

        const updateNativeNavigation = () => {
            if (navigation) {
                currentCanGoBack = navigation.canGoBack;
                setCanGoBack(currentCanGoBack);
            }
        };

        if (navigation) {
            navigation.addEventListener('currententrychange', updateNativeNavigation);
        } else {
            saveTrackedCanGoBack(history, currentCanGoBack);
        }
        setCanGoBack(currentCanGoBack);

        const unlisten = history.listen((_location, action) => {
            if (
                navigation &&
                !navigation.canGoBack &&
                (action === 'PUSH' || readTrackedCanGoBack(history))
            ) {
                // Detect incomplete pushState support without browser version checks.
                navigation.removeEventListener('currententrychange', updateNativeNavigation);
                navigation = undefined;
            }
            if (navigation) {
                updateNativeNavigation();
                return;
            }

            if (action === 'PUSH') {
                currentCanGoBack = true;
            } else if (action === 'POP') {
                currentCanGoBack = readTrackedCanGoBack(history);
            }
            // REPLACE changes the URL but keeps the current position in history.
            saveTrackedCanGoBack(history, currentCanGoBack);
            setCanGoBack(currentCanGoBack);
        });

        return () => {
            unlisten();
            navigation?.removeEventListener('currententrychange', updateNativeNavigation);
        };
    }, [history]);

    return (
        <BackNavigationContext.Provider value={canGoBack}>
            {children}
        </BackNavigationContext.Provider>
    );
}

export function useCanGoBack() {
    return React.useContext(BackNavigationContext);
}
