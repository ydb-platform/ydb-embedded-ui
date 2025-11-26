import {api} from '../api';

import {prepareNodeData} from './utils';

export const nodeApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNodeInfo: build.query({
            queryFn: async ({nodeId, database}: {nodeId: string; database?: string}, {signal}) => {
                try {
                    const data = await window.api.viewer.getNodeInfo({nodeId, database}, {signal});
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
                    const data = await window.api.viewer.getStorageInfo({nodeId}, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getNodePeers: build.query({
            queryFn: async ({nodeId}: {nodeId: string}, {signal}) => {
                try {
                    const data = await window.api.viewer.getNodePeers({nodeId}, {signal});
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
