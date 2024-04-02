import React from 'react';

import {AutoFetcher} from '../autofetcher';

export const useAutofetcher = (
    fetchData: (isBackground: boolean) => void,
    deps: React.DependencyList,
    enabled = true,
) => {
    const ref = React.useRef<AutoFetcher | null>(null);

    if (ref.current === null) {
        ref.current = new AutoFetcher();
    }

    const autofetcher = ref.current;

    // initial fetch
    React.useEffect(() => {
        fetchData(false);
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        autofetcher.stop();

        if (enabled) {
            autofetcher.start();
            autofetcher.fetch(() => fetchData(true));
        }

        return () => {
            autofetcher.stop();
        };
    }, [enabled, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
};
