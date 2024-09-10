import type {StorageRequestParams} from '../../../types/api/storage';
import {api} from '../api';
import type {NodesApiRequestParams} from '../nodes/types';

import {prepareStorageNodesResponse, prepareStorageResponse} from './utils';

export const storageApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getStorageNodesInfo: builder.query({
            queryFn: async (params: Omit<NodesApiRequestParams, 'type'>, {signal}) => {
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
            providesTags: ['All'],
        }),
        getStorageGroupsInfo: builder.query({
            queryFn: async (params: StorageRequestParams, {signal}) => {
                try {
                    const result = await window.api.getStorageInfo(
                        {version: 'v1', ...params},
                        {signal},
                    );
                    return {data: prepareStorageResponse(result)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
