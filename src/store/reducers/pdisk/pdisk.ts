import type {TPDiskInfoResponse} from '../../../types/api/pdisk';
import {getPDiskId} from '../../../utils/disks/helpers';
import {api} from '../api';
import {queryCapability} from '../capabilities/capabilities';

import {preparePDiskDataResponse} from './utils';

interface PDiskParams {
    nodeId: number | string;
    pDiskId: number | string;
}

export const pDiskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getPdiskInfo: build.query({
            queryFn: async ({nodeId, pDiskId}: PDiskParams, {signal, getState, dispatch}) => {
                const newApiAvailable =
                    (await queryCapability('/pdisk/info', {getState: getState as any, dispatch})) >
                    0;

                let diskInfoPromise: Promise<TPDiskInfoResponse>;
                if (newApiAvailable) {
                    diskInfoPromise = window.api.getPDiskInfo({nodeId, pDiskId}, {signal});
                } else {
                    diskInfoPromise = window.api
                        .getNodeWhiteboardPDiskInfo({nodeId, pDiskId}, {signal})
                        .then((result) => {
                            if (result.PDiskStateInfo) {
                                return {
                                    Whiteboard: {PDisk: result.PDiskStateInfo[0]},
                                };
                            }
                            return {};
                        });
                }

                try {
                    const response = await Promise.all([
                        diskInfoPromise,
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
    }),
    overrideExisting: 'throw',
});
