import React from 'react';

/** Delay filtering only. Reset immediately when the caller's scope changes. */
export function useDebouncedSearch(value: string, scope: string) {
    const [applied, setApplied] = React.useState({value, scope});

    React.useEffect(() => {
        const timer = window.setTimeout(() => setApplied({value, scope}), 200);
        return () => window.clearTimeout(timer);
    }, [value, scope]);

    // Never use a previous entity's filter, even for the first render after navigation.
    if (applied.scope !== scope) {
        setApplied({value, scope});
        return value;
    }

    return applied.value;
}
