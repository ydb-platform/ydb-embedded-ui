import type {TPDiskInfoResponse} from '../../../types/api/pdisk';
import {getPDiskId} from '../../../utils/disks/helpers';
import {getDatacenterQueryContext} from '../../datacenterQueryContext';
import type {GetState} from '../../defaultStore';
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
                const meta = getDatacenterQueryContext(getState);
                const context = {
                    getState: getState as GetState,
                    dispatch,
                };
                const [pDiskInfoHandlerVersion, dDisksVersion] = await Promise.all([
                    queryCapability('/pdisk/info', undefined, context),
                    queryCapability('/pdisk/info/ddisks', undefined, context),
                ]);
                const newApiAvailable = pDiskInfoHandlerVersion > 0;

                let diskInfoPromise: Promise<TPDiskInfoResponse>;
                if (newApiAvailable) {
                    diskInfoPromise = window.api.pdisk.getPDiskInfo(
                        {nodeId, pDiskId, includeDDisks: dDisksVersion >= 1},
                        {signal},
                    );
                } else {
                    diskInfoPromise = window.api.viewer
                        .getNodeWhiteboardPDiskInfo({nodeId, pDiskId}, {signal})
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
                        window.api.viewer.getNodeInfo({nodeId}, {signal}),
                    ]);
                    const data = preparePDiskDataResponse(response);
                    return {data, meta};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => [
                'All',
                {
                    type: 'PDiskData',
                    id: getPDiskId({nodeId: arg.nodeId, pDiskId: arg.pDiskId}),
                },
            ],
        }),
    }),
    overrideExisting: 'throw',
});
