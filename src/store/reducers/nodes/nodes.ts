import type {NodesRequestParams} from '../../../types/api/nodes';
import {api} from '../api';

import {prepareNodesData} from './utils';

export const nodesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNodes: builder.query({
            queryFn: async (params: NodesRequestParams, {signal}) => {
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
    }),
    overrideExisting: 'throw',
});
