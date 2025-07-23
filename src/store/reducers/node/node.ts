import type {TThreadPoolInfo} from '../../../types/api/threads';
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
                    // If the backend provides Threads field with detailed info, use it
                    // Otherwise, fall back to mock data for development
                    if (data.Threads && data.Threads.length > 0) {
                        return {
                            data: {
                                Threads: data.Threads,
                                ResponseTime: data.ResponseTime,
                                ResponseDuration: data.ResponseDuration,
                            },
                        };
                    }

                    // Fallback to mock data for development until backend is fully implemented
                    const mockThreadData = {
                        Threads: [
                            {
                                Name: 'AwsEventLoop',
                                Threads: 64,
                                SystemUsage: 0,
                                UserUsage: 0,
                                MinorPageFaults: 0,
                                MajorPageFaults: 0,
                                States: {S: 64},
                            },
                            {
                                Name: 'klktmr.IC',
                                Threads: 3,
                                SystemUsage: 0.2917210162,
                                UserUsage: 0.470575124,
                                MinorPageFaults: 0,
                                MajorPageFaults: 0,
                                States: {R: 2, S: 1},
                            },
                            {
                                Name: 'klktmr.IO',
                                Threads: 1,
                                SystemUsage: 0.001333074062,
                                UserUsage: 0.001333074062,
                                MinorPageFaults: 0,
                                MajorPageFaults: 0,
                                States: {S: 1},
                            },
                        ] as TThreadPoolInfo[],
                        ResponseTime: data.ResponseTime,
                        ResponseDuration: data.ResponseDuration,
                    };
                    return {data: mockThreadData};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
