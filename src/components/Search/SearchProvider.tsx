import React from 'react';

import type {Location} from 'history';
import {useHistory} from 'react-router-dom';
import type {QueryParamConfigMap} from 'use-query-params';

import {useDebouncedValue} from '../../utils/hooks/useDebouncedValue';

export const SearchContext = React.createContext<
    readonly [string, (value: string) => void] | undefined
>(undefined);

interface SearchProviderProps {
    value: string;
    onChange: (value: string) => void;
    queryParams: QueryParamConfigMap;
    scope?: string;
    children: React.ReactNode;
}

/** Keep the draft above table remounts; publish it only after typing stops. */
export function SearchProvider({
    value,
    onChange,
    queryParams,
    scope,
    children,
}: SearchProviderProps) {
    const history = useHistory();
    const generation = React.useRef(0);
    const [navigation, setNavigation] = React.useState(0);

    React.useEffect(() => {
        const context = (location: Location) => {
            const params = new URLSearchParams(location.search);
            // Local filters may change while typing. Any other query parameter is context.
            Object.keys(queryParams).forEach((key) => params.delete(key));
            params.sort();
            return JSON.stringify([location.pathname, location.hash, params.toString()]);
        };
        let previous = context(history.location);
        return history.listen((location, action) => {
            const next = context(location);
            if (action !== 'REPLACE' || next !== previous) {
                generation.current += 1;
                setNavigation(generation.current);
            }
            previous = next;
        });
    }, [history, queryParams]);

    const search = useDebouncedValue({
        value,
        onUpdate: (next) => {
            // Navigation can happen before React commits the reset and clears the timer.
            if (generation.current === navigation) {
                onChange(next);
            }
        },
        resetKey: JSON.stringify([scope, navigation]),
    });

    return <SearchContext.Provider value={search}>{children}</SearchContext.Provider>;
}
