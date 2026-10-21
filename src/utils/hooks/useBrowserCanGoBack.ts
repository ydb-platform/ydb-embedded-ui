import React from 'react';

interface BrowserNavigation extends EventTarget {
    readonly canGoBack: boolean;
}

function getNavigation() {
    return (window as Window & {navigation?: BrowserNavigation}).navigation;
}

function subscribe(onChange: () => void) {
    const navigation = getNavigation();
    navigation?.addEventListener('currententrychange', onChange);
    return () => navigation?.removeEventListener('currententrychange', onChange);
}

export function useBrowserCanGoBack() {
    return React.useSyncExternalStore(
        subscribe,
        () => getNavigation()?.canGoBack,
        () => undefined,
    );
}
