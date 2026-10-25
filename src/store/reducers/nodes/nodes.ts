import type {NodesRequestParams} from '../../../types/api/nodes';
import type {QueryScope} from '../../queryScope';
import {api} from '../api';
import {prepareStorageNodesResponse} from '../storage/utils';

export const nodesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNodes: builder.query({
            queryFn: async (
                {scope: _scope, ...params}: NodesRequestParams & {scope?: QueryScope},
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getNodes(
                        {
                            type: 'any',
                            storage: false,
                            tablets: true,
                            ...params,
                        },
                        {signal},
                    );
                    return {data: prepareStorageNodesResponse(data)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
