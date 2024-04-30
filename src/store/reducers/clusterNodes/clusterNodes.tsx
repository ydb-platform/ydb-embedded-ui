import type {TSystemStateInfo} from '../../../types/api/nodes';
import {calcUptime} from '../../../utils/dataFormatters/dataFormatters';
import {api} from '../api';

export interface PreparedClusterNode extends TSystemStateInfo {
    uptime: string;
}

export const clusterNodesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getClusterNodes: builder.query({
            queryFn: async () => {
                try {
                    const result = await window.api.getClusterNodes();
                    const {SystemStateInfo: nodes = []} = result;
                    const data: PreparedClusterNode[] = nodes.map((node) => {
                        return {
                            ...node,
                            uptime: calcUptime(node.StartTime),
                        };
                    });
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
