import type {NodesRequestParams} from '../../../types/api/nodes';
import type {GroupsRequestParams, StorageRequestParams} from '../../../types/api/storage';
import {api} from '../api';

import {requestStorageData} from './requestStorageData';
import {prepareStorageNodesResponse} from './utils';

export const storageApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getStorageNodesInfo: builder.query({
            queryFn: async (params: Omit<NodesRequestParams, 'type'>, {signal}) => {
                try {
                    const result = await window.api.getNodes(
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
            queryFn: async (
                params: StorageRequestParams &
                    GroupsRequestParams & {shouldUseGroupsHandler?: boolean},
                {signal},
            ) => {
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
