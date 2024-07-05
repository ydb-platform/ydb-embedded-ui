import type {PreparedNodeSystemState} from '../../../utils/nodes';
import {prepareNodeSystemState} from '../../../utils/nodes';
import {api} from '../api';

export type PreparedClusterNode = PreparedNodeSystemState;

export const clusterNodesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getClusterNodes: builder.query({
            queryFn: async () => {
                try {
                    const result = await window.api.getClusterNodes();
                    const {SystemStateInfo: nodes = []} = result;
                    const data: PreparedClusterNode[] = nodes.map(prepareNodeSystemState);
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
