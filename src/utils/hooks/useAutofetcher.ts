import {DependencyList, useEffect, useRef} from 'react';

import {AutoFetcher} from '../autofetcher';

export const useAutofetcher = (
    fetchData: (isBackground: boolean) => void,
    deps: DependencyList,
    enabled = true,
) => {
    const ref = useRef<AutoFetcher | null>(null);

    if (ref.current === null) {
        ref.current = new AutoFetcher();
    }

    const autofetcher = ref.current;

    // initial fetch
    useEffect(() => {
        fetchData(false);
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
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
