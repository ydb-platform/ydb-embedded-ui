import React from 'react';

import {useLocation} from 'react-router-dom';

/** Delay filtering only. The input and URL keep the current search value. */
export function useDebouncedSearch(value: string) {
    const {pathname, search} = useLocation();
    const params = new URLSearchParams(search);
    const scope = JSON.stringify([
        pathname,
        ...['environment', 'clusterName', 'database', 'schema', 'path', 'backend'].map((key) =>
            params.get(key),
        ),
    ]);
    const [applied, setApplied] = React.useState({value, scope});

    React.useEffect(() => {
        const timer = window.setTimeout(() => setApplied({value, scope}), 200);
        return () => window.clearTimeout(timer);
    }, [value, scope]);

    // Never use a previous database's filter, even for the first render after navigation.
    if (applied.scope !== scope) {
        setApplied({value, scope});
        return value;
    }

    return applied.value;
}
