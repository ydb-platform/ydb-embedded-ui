import {getPDiskId} from '../../../utils/disks/helpers';
import {api} from '../api';

import {preparePDiskDataResponse, preparePDiskStorageResponse} from './utils';

interface PDiskParams {
    nodeId: number | string;
    pDiskId: number | string;
}

export const pDiskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getPdiskInfo: build.query({
            queryFn: async ({nodeId, pDiskId}: PDiskParams, {signal}) => {
                try {
                    const response = await Promise.all([
                        window.api.getPDiskInfo({nodeId, pDiskId}, {signal}),
                        window.api.getNodeInfo(nodeId, {signal}),
                    ]);
                    const data = preparePDiskDataResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => [
                'All',
                {
                    type: 'PDiskData',
                    id: getPDiskId(arg.nodeId, arg.pDiskId),
                },
            ],
        }),
        getStorageInfo: build.query({
            queryFn: async ({nodeId, pDiskId}: PDiskParams, {signal}) => {
                try {
                    const response = await window.api.getStorageInfo(
                        {nodeId, version: 'v1'},
                        {signal},
                    );
                    const data = preparePDiskStorageResponse(response, pDiskId, nodeId);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => [
                'All',
                {
                    type: 'PDiskData',
                    id: getPDiskId(arg.nodeId, arg.pDiskId),
                },
            ],
        }),
    }),
    overrideExisting: 'throw',
});
