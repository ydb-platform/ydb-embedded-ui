import React from 'react';

/** Debounce the table filter, never the input or its URL value. */
export function useDebouncedSearch(searchValue: string) {
    const [debouncedSearch, setDebouncedSearch] = React.useState(searchValue);

    React.useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(searchValue), 200);
        return () => window.clearTimeout(timer);
    }, [searchValue]);

    return debouncedSearch;
}
