import type {TPDiskInfoResponse} from '../../../types/api/pdisk';
import {getPDiskId} from '../../../utils/disks/helpers';
import type {GetState} from '../../defaultStore';
import {api} from '../api';
import {queryCapability} from '../capabilities/capabilities';

import {preparePDiskDataResponse} from './utils';

interface PDiskParams {
    nodeId: number | string;
    pDiskId: number | string;
    database?: string;
}

export const pDiskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getPdiskInfo: build.query({
            queryFn: async (
                {nodeId, pDiskId, database}: PDiskParams,
                {signal, getState, dispatch},
            ) => {
                const pDiskInfoHandlerVersion = await queryCapability('/pdisk/info', database, {
                    getState: getState as GetState,
                    dispatch,
                });
                const newApiAvailable = pDiskInfoHandlerVersion > 0;

                let diskInfoPromise: Promise<TPDiskInfoResponse>;
                if (newApiAvailable) {
                    diskInfoPromise = window.api.pdisk.getPDiskInfo(
                        {nodeId, pDiskId, database},
                        {signal},
                    );
                } else {
                    diskInfoPromise = window.api.viewer
                        .getNodeWhiteboardPDiskInfo({nodeId, pDiskId, database}, {signal})
                        .then((result) => {
                            if (result.PDiskStateInfo) {
                                return {
                                    Whiteboard: {
                                        PDisk: {
                                            ...result.PDiskStateInfo[0],
                                            ExpectedSlotCount: undefined,
                                        },
                                    },
                                };
                            }
                            return {};
                        });
                }

                try {
                    const response = await Promise.all([
                        diskInfoPromise,
                        window.api.viewer.getNodeInfo(nodeId, database, {signal}),
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
