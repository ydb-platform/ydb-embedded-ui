import {createSelector} from '@reduxjs/toolkit';

import {prepareNodeHostsMap} from '../../utils/nodes';
import type {RootState} from '../defaultStore';

import {api} from './api';

export const nodesListApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNodesList: build.query({
            queryFn: async (_, {signal}) => {
                try {
                    const data = await window.api.viewer.getNodesList({signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});

const selectNodesList = nodesListApi.endpoints.getNodesList.select(undefined);

export const selectNodeHostsMap = createSelector(
    (state: RootState) => selectNodesList(state).data,
    (data) => prepareNodeHostsMap(data),
);
