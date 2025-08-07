import {createSelector} from '@reduxjs/toolkit';

import {prepareNodesMap} from '../../utils/nodes';
import type {RootState} from '../defaultStore';

import {api} from './api';

export const nodesListApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNodesList: build.query({
            queryFn: async ({database}, {signal}) => {
                try {
                    const data = await window.api.viewer.getNodesList({database}, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});

const createGetNodesListSelector = createSelector(
    (database?: string) => database,
    (database) => nodesListApi.endpoints.getNodesList.select({database}),
);

export const selectNodesMap = createSelector(
    (state: RootState) => state,
    (_state: RootState, database?: string) => createGetNodesListSelector(database),
    (state, selectNodesList) => prepareNodesMap(selectNodesList(state).data),
);
