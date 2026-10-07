import type {NbsListParams} from '../../../types/api/nbs';
import type {NodesRequestParams} from '../../../types/api/nodes';
import type {GroupsRequestParams} from '../../../types/api/storage';
import {api} from '../api';

import {getTabletGroups} from './getNbsTabletGroups';
import {requestStorageData} from './requestStorageData';
import {prepareStorageNodesResponse} from './utils';

export const storageApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNbsTabletDetails: builder.query({
            queryFn: async (
                {
                    tabletId,
                }: {tabletId: string; backend?: string; clusterName?: string; environment?: string},
                {signal},
            ) => {
                try {
                    return {data: await getTabletGroups(tabletId, signal)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', 'StorageData'],
        }),
        getNbsTabletGroups: builder.query({
            queryFn: async (params: NbsListParams, {signal}) => {
                try {
                    const data = await window.api.storage.getNbsStorage(
                        'tablets',
                        {...params, limit: 1},
                        {signal},
                    );
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', 'StorageData'],
        }),
        getStorageNodesInfo: builder.query({
            queryFn: async (params: Omit<NodesRequestParams, 'type'>, {signal}) => {
                try {
                    const result = await window.api.viewer.getNodes(
                        {storage: true, type: 'static', ...params},
                        {signal},
                    );
                    return {data: prepareStorageNodesResponse(result)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', 'StorageData'],
        }),
        getStorageGroupsInfo: builder.query({
            queryFn: async (params: GroupsRequestParams, {signal}) => {
                try {
                    const result = await requestStorageData(params, {signal});
                    return {data: result};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', 'StorageData'],
        }),
    }),
    overrideExisting: 'throw',
});
