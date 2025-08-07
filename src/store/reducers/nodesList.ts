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

const selectNodesList = nodesListApi.endpoints.getNodesList.select(undefined);

export const selectNodesMap = createSelector(
    (state: RootState) => selectNodesList(state).data,
    (data) => prepareNodesMap(data),
);
