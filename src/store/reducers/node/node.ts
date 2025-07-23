import {api} from '../api';

import {prepareNodeData} from './utils';

export const nodeApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNodeInfo: build.query({
            queryFn: async ({nodeId}: {nodeId: string}, {signal}) => {
                try {
                    const data = await window.api.viewer.getNodeInfo(nodeId, {signal});
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
        getNodeThreads: build.query({
            queryFn: async ({nodeId}: {nodeId: string}, {signal}) => {
                try {
                    const data = await window.api.viewer.getNodeInfo(nodeId, {signal});

                    // Extract thread information from the response
                    return {
                        data: {
                            Threads: data.Threads || [],
                            ResponseTime: data.ResponseTime,
                            ResponseDuration: data.ResponseDuration,
                        },
                    };
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
