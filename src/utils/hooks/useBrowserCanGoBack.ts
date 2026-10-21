import React from 'react';

import type {History} from 'history';

interface BrowserNavigation extends EventTarget {
    readonly canGoBack: boolean;
}

function getNavigation() {
    return (window as Window & {navigation?: BrowserNavigation}).navigation;
}

export function useBrowserCanGoBack(history: History) {
    const subscribe = React.useCallback(
        (onChange: () => void) => {
            const navigation = getNavigation();
            navigation?.addEventListener('currententrychange', onChange);
            const unlisten = history.listen(onChange);
            return () => {
                unlisten();
                navigation?.removeEventListener('currententrychange', onChange);
            };
        },
        [history],
    );

    return React.useSyncExternalStore(
        subscribe,
        () => {
            // Memory history may copy the host's location key without owning its browser entry.
            if ('canGo' in history || window.history.state?.key !== history.location.key) {
                return undefined;
            }
            return getNavigation()?.canGoBack;
        },
        () => undefined,
    );
}
