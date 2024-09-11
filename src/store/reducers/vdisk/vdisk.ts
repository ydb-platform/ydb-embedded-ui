import {getVDiskSlotBasedId} from '../../../utils/disks/helpers';
import {api} from '../api';

import {prepareVDiskDataResponse} from './utils';

interface VDiskDataRequestParams {
    nodeId: number | string;
    pDiskId: number | string;
    vDiskSlotId: number | string;
}

export const vDiskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getVDiskData: build.query({
            queryFn: async ({nodeId, pDiskId, vDiskSlotId}: VDiskDataRequestParams, {signal}) => {
                try {
                    const response = await Promise.all([
                        window.api.getVDiskInfo({nodeId, pDiskId, vDiskSlotId}, {signal}),
                        window.api.getNodeWhiteboardPDiskInfo({nodeId, pDiskId}, {signal}),
                        window.api.getNodeInfo(nodeId, {signal}),
                    ]);
                    const data = prepareVDiskDataResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => [
                'All',
                {
                    type: 'VDiskData',
                    id: getVDiskSlotBasedId(arg.nodeId, arg.pDiskId, arg.vDiskSlotId),
                },
            ],
        }),
    }),
    overrideExisting: 'throw',
});
