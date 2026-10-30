import React from 'react';

import {useStore} from 'react-redux';

import {createDatacenterRegistrar} from '../../store/reducers/datacenters';

/** Register DCs from node fetchers used by the generic RTK Query table endpoint. */
export function useDatacenterNodesFetcher<
    Params,
    Result extends {data: readonly {DCKey?: string}[]},
>(fetchData: (params: Params) => Promise<Result>) {
    const store = useStore();
    return React.useCallback(
        async (params: Params) => {
            const registerDatacenters = createDatacenterRegistrar(store);
            const result = await fetchData(params);
            registerDatacenters(result.data.map((node) => node.DCKey));
            return result;
        },
        [fetchData, store],
    );
}
