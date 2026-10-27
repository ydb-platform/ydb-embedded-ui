import type {NodesRequestParams} from '../../../types/api/nodes';
import {getDatacenterQueryContext} from '../../datacenterQueryContext';
import type {QueryScope} from '../../queryScope';
import {api} from '../api';
import {prepareStorageNodesResponse} from '../storage/utils';

export const nodesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNodes: builder.query({
            queryFn: async (
                {scope, ...params}: NodesRequestParams & {scope?: QueryScope},
                {signal, getState},
            ) => {
                const meta = getDatacenterQueryContext(getState, scope);
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
                    return {data: prepareStorageNodesResponse(data), meta};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
