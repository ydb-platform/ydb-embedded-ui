import type {StorageGroupsResponse} from '../../../types/api/storage';
import type {TEvSystemStateResponse} from '../../../types/api/systemState';
import {getVDiskSlotBasedId} from '../../../utils/disks/helpers';
import {api} from '../api';

import {prepareVDiskDataResponse} from './utils';

type VDiskDataRequestParams = {
    vDiskId: string;
    nodeId?: number | string;
    database?: string;
};

type VDiskBlobIndexStatBasicParams =
    | {nodeId: string | number; pDiskId: string | number; vDiskSlotId: string | number}
    | {vDiskId: string};

export type VDiskBlobIndexStatParams = VDiskBlobIndexStatBasicParams & {
    database?: string;
};

export const vDiskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getVDiskData: build.query({
            queryFn: async (params: VDiskDataRequestParams, {signal}) => {
                try {
                    const {nodeId, database, vDiskId} = params;
                    const groupId = vDiskId.split('-', 1)[0];

                    const promises: [
                        Promise<StorageGroupsResponse>,
                        Promise<TEvSystemStateResponse> | undefined,
                    ] = [
                        window.api.storage.getStorageGroups(
                            {
                                groupId,
                                database,
                                nodeId,
                                fieldsRequired: 'all',
                            },
                            {signal},
                        ),
                        nodeId
                            ? window.api.viewer.getNodeInfo({nodeId, database}, {signal})
                            : undefined,
                    ];
                    const response = await Promise.all(promises);
                    const data = prepareVDiskDataResponse(response, vDiskId);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => [
                'All',
                {
                    type: 'VDiskData',
                    id: arg.vDiskId,
                },
            ],
        }),
        getVDiskBlobIndexStat: build.query({
            queryFn: async (params: VDiskBlobIndexStatParams, {signal}) => {
                try {
                    const response = await window.api.viewer.getVDiskBlobIndexStat(params, {
                        signal,
                    });
                    return {data: response};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => [
                'All',
                {
                    type: 'VDiskBlobIndexStat',
                    id: getVDiskSlotBasedId(arg),
                },
            ],
        }),
    }),
    overrideExisting: 'throw',
});
