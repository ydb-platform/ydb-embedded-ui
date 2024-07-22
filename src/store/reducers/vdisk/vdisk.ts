import {EVersion} from '../../../types/api/storage';
import {valueIsDefined} from '../../../utils';
import {api} from '../api';

import type {VDiskGroup} from './types';
import {prepareVDiskDataResponse, prepareVDiskGroupResponse} from './utils';

interface VDiskDataRequestParams {
    nodeId: number | string;
    pDiskId: number | string;
    vDiskSlotId: number | string;
}

export const vDiskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getVDiskData: build.query({
            queryFn: async ({nodeId, pDiskId, vDiskSlotId}) => {
                try {
                    const {vDiskData, groupData} = await requestVDiskData({
                        nodeId,
                        pDiskId,
                        vDiskSlotId,
                    });
                    return {data: {vDiskData, groupData}};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});

async function requestVDiskData(
    {nodeId, pDiskId, vDiskSlotId}: VDiskDataRequestParams,
    {signal}: {signal?: AbortSignal} = {},
) {
    const vDiskDataResponse = await Promise.all([
        window.api.getVDiskInfo({nodeId, pDiskId, vDiskSlotId}, {signal}),
        window.api.getNodeWhiteboardPDiskInfo({nodeId, pDiskId}, {signal}),
        window.api.getNodeInfo(nodeId, {signal}),
    ]);

    const vDiskData = prepareVDiskDataResponse(vDiskDataResponse);

    const {StoragePoolName, VDiskId = {}} = vDiskData;
    const {GroupID} = VDiskId;

    let groupData: VDiskGroup | undefined;

    if (valueIsDefined(StoragePoolName) && valueIsDefined(GroupID)) {
        const groupResponse = await window.api.getStorageInfo(
            {
                nodeId,
                poolName: StoragePoolName,
                groupId: GroupID,
                version: EVersion.v1,
            },
            {signal},
        );
        groupData = prepareVDiskGroupResponse(groupResponse, StoragePoolName, GroupID);
    }

    return {vDiskData, groupData};
}
