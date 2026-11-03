import {createSelector} from '@reduxjs/toolkit';

import {prepareNodesMap} from '../../utils/nodes';
import {getDatacenterQueryContext} from '../datacenterQueryContext';
import type {RootState} from '../defaultStore';

import {api} from './api';

export interface NodesListQueryArgs {
    database?: string;
}

export const nodesListApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNodesList: build.query({
            queryFn: async ({database}: NodesListQueryArgs, {signal, getState}) => {
                const meta = getDatacenterQueryContext(getState);
                try {
                    const data = await window.api.viewer.getNodesList({database}, {signal});
                    return {data, meta};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});

const createGetNodesListSelector = createSelector(
    (database: string | undefined) => database,
    (database) => nodesListApi.endpoints.getNodesList.select({database}),
);

export const selectNodesMap = createSelector(
    (state: RootState, database?: string) => createGetNodesListSelector(database)(state).data,
    prepareNodesMap,
);
