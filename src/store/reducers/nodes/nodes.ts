import {EVersion} from '../../../types/api/compute';
import {api} from '../api';

import type {ComputeApiRequestParams, NodesApiRequestParams} from './types';
import {prepareComputeNodesData, prepareNodesData} from './utils';

export const nodesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNodes: builder.query({
            queryFn: async (params: NodesApiRequestParams, {signal}) => {
                try {
                    const data = await window.api.getNodes(
                        {
                            type: 'any',
                            storage: false,
                            tablets: true,
                            ...params,
                        },
                        {signal},
                    );
                    return {data: prepareNodesData(data)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getComputeNodes: builder.query({
            queryFn: async (params: ComputeApiRequestParams, {signal}) => {
                try {
                    const data = await window.api.getCompute(
                        {
                            version: EVersion.v2,
                            ...params,
                        },
                        {signal},
                    );
                    return {data: prepareComputeNodesData(data)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
