import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {api} from '../../api';
import type {NodesApiRequestParams} from '../../nodes/types';
import {prepareNodesData} from '../../nodes/utils';

export const topNodesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTopNodes: builder.query({
            queryFn: async (params: NodesApiRequestParams, {signal}) => {
                try {
                    const data = await window.api.getNodes(
                        {
                            type: 'any',
                            sortOrder: -1,
                            // sortValue: 'CPU',
                            limit: TENANT_OVERVIEW_TABLES_LIMIT,
                            ...params,
                        },
                        {signal},
                    );
                    return {data: prepareNodesData(data).Nodes};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
});
