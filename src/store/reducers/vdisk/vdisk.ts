import {getVDiskSlotBasedId} from '../../../utils/disks/helpers';
import {api} from '../api';

import {prepareVDiskDataResponse} from './utils';

type VDiskDataBasicRequestParams = {
    vDiskId: string;
    database?: string;
};
type VDiskDataExtendedRequestParams = {
    nodeId: number | string;
    pDiskId: number | string;
    vDiskSlotId: number | string;
    database?: string;
};

type VDiskDataRequestParams = VDiskDataBasicRequestParams | VDiskDataExtendedRequestParams;

function isVDiskDataExtendedRequestParams(
    params: VDiskDataRequestParams,
): params is VDiskDataExtendedRequestParams {
    return 'nodeId' in params && 'pDiskId' in params && 'vDiskSlotId' in params;
}

export const vDiskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getVDiskData: build.query({
            queryFn: async (params: VDiskDataRequestParams, {signal}) => {
                try {
                    if (isVDiskDataExtendedRequestParams(params)) {
                        const {nodeId, pDiskId, vDiskSlotId, database} = params;
                        const response = await Promise.all([
                            window.api.viewer.getVDiskInfo(
                                {nodeId, pDiskId, vDiskSlotId, database},
                                {signal},
                            ),
                            window.api.viewer.getNodeWhiteboardPDiskInfo(
                                {nodeId, pDiskId, database},
                                {signal},
                            ),
                            window.api.viewer.getNodeInfo({nodeId, database}, {signal}),
                        ]);
                        const data = prepareVDiskDataResponse(response);
                        return {data};
                    } else {
                        const {vDiskId, database} = params;
                        const response = await window.api.viewer.getVDiskInfo(
                            {vDiskId, database},
                            {signal},
                        );
                        const data = prepareVDiskDataResponse([response, undefined, undefined]);
                        return {data};
                    }
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => [
                'All',
                {
                    type: 'VDiskData',
                    id: isVDiskDataExtendedRequestParams(arg)
                        ? getVDiskSlotBasedId(arg.nodeId, arg.pDiskId, arg.vDiskSlotId)
                        : arg.vDiskId,
                },
            ],
        }),
        getVDiskBlobIndexStat: build.query({
            queryFn: async (
                {nodeId, pDiskId, vDiskSlotId, database}: VDiskDataExtendedRequestParams,
                {signal},
            ) => {
                try {
                    const response = await window.api.viewer.getVDiskBlobIndexStat(
                        {nodeId, pDiskId, vDiskSlotId, database},
                        {signal},
                    );
                    return {data: response};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => [
                'All',
                {
                    type: 'VDiskBlobIndexStat',
                    id: getVDiskSlotBasedId(arg.nodeId, arg.pDiskId, arg.vDiskSlotId),
                },
            ],
        }),
    }),
    overrideExisting: 'throw',
});
