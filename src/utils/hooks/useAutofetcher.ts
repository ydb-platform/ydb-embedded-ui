import {DependencyList, useEffect} from 'react';

import {AutoFetcher} from '../autofetcher';

const autofetcher = new AutoFetcher();

export const useAutofetcher = (fetchData: VoidFunction, deps: DependencyList, enabled = true) => {
    // initial fetch
    useEffect(fetchData, deps); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        autofetcher.stop();

        if (enabled) {
            autofetcher.start();
            autofetcher.fetch(fetchData);
        }

        return () => {
            autofetcher.stop();
        };
    }, [enabled, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
};
