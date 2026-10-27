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
    queryParamConfig: QueryParamConfigMap;
    resetKey?: string;
    children: React.ReactNode;
}

/** Keep the draft above table remounts; publish it only after typing stops. */
export function SearchProvider({
    value,
    onChange,
    queryParamConfig,
    resetKey,
    children,
}: SearchProviderProps) {
    const history = useHistory();
    const latestNavigationId = React.useRef(0);
    const [navigationId, setNavigationId] = React.useState(0);

    React.useEffect(() => {
        const getContextKey = (location: Location) => {
            const params = new URLSearchParams(location.search);
            // Local filters may change while typing. Any other query parameter is context.
            Object.keys(queryParamConfig).forEach((key) => params.delete(key));
            params.sort();
            return JSON.stringify([location.pathname, location.hash, params.toString()]);
        };
        let previousContextKey = getContextKey(history.location);
        return history.listen((location, action) => {
            const nextContextKey = getContextKey(location);
            if (action !== 'REPLACE' || nextContextKey !== previousContextKey) {
                latestNavigationId.current += 1;
                setNavigationId(latestNavigationId.current);
            }
            previousContextKey = nextContextKey;
        });
    }, [history, queryParamConfig]);

    const draftState = useDebouncedValue({
        value,
        onUpdate: (nextValue) => {
            // Navigation can happen before React commits the reset and clears the timer.
            if (latestNavigationId.current === navigationId) {
                onChange(nextValue);
            }
        },
        resetKey: JSON.stringify([resetKey, navigationId]),
    });

    return <SearchContext.Provider value={draftState}>{children}</SearchContext.Provider>;
}
