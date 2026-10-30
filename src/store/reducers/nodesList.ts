import {createSelector} from '@reduxjs/toolkit';

import {prepareNodesMap} from '../../utils/nodes';
import {getDatacenterQueryContext} from '../datacenterQueryContext';
import type {RootState} from '../defaultStore';

import {api} from './api';

export interface NodesListQueryArgs {
    database?: string;
    include_storage?: boolean;
}

export const nodesListApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNodesList: build.query({
            queryFn: async (
                {database, include_storage: includeStorage}: NodesListQueryArgs,
                {signal, getState},
            ) => {
                const meta = getDatacenterQueryContext(getState);
                try {
                    const data = await window.api.viewer.getNodesList(
                        {database, include_storage: includeStorage},
                        {signal},
                    );
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
    (_database: string | undefined, includeStorage?: boolean) => includeStorage,
    (database, includeStorage) =>
        nodesListApi.endpoints.getNodesList.select({
            database,
            include_storage: includeStorage,
        }),
);

export const selectNodesMap = createSelector(
    (state: RootState, database?: string, includeStorage?: boolean) =>
        createGetNodesListSelector(database, includeStorage)(state).data,
    prepareNodesMap,
);
