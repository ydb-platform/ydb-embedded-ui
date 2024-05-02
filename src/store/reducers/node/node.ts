import {api} from '../api';

import {prepareNodeData} from './utils';

export const nodeApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNodeInfo: build.query({
            queryFn: async ({nodeId}: {nodeId: string}, {signal}) => {
                try {
                    const data = await window.api.getNodeInfo(nodeId, {signal});
                    return {data: prepareNodeData(data)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getNodeStructure: build.query({
            queryFn: async ({nodeId}: {nodeId: string}, {signal}) => {
                try {
                    const data = await window.api.getStorageInfo({nodeId}, {signal});
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
