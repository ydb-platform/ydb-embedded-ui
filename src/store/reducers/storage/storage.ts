import {EVersion} from '../../../types/api/storage';
import {api} from '../api';
import type {NodesApiRequestParams} from '../nodes/types';

import type {StorageApiRequestParams} from './types';
import {prepareStorageGroupsResponse, prepareStorageNodesResponse} from './utils';

export const storageApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getStorageNodesInfo: builder.query({
            queryFn: async (params: Omit<NodesApiRequestParams, 'type'>, {signal}) => {
                try {
                    const result = await window.api.getNodes(
                        {storage: true, type: 'static', tablets: false, ...params},
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
            queryFn: async (params: StorageApiRequestParams, {signal}) => {
                try {
                    const result = await window.api.getStorageInfo(
                        {version: EVersion.v1, ...params},
                        {signal},
                    );
                    return {data: prepareStorageGroupsResponse(result)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
