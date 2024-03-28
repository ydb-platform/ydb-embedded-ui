import type {Reducer} from '@reduxjs/toolkit';

import {EVersion} from '../../../types/api/storage';
import {valueIsDefined} from '../../../utils';
import {createRequestActionTypes, createApiRequest} from '../../utils';
import type {VDiskAction, VDiskGroup, VDiskState} from './types';
import {prepareVDiskDataResponse, prepareVDiskGroupResponse} from './utils';

export const FETCH_VDISK = createRequestActionTypes('vdisk', 'FETCH_VDISK');
const SET_VDISK_DATA_WAS_NOT_LOADED = 'vdisk/SET_VDISK_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
    vDiskData: {},
};

const vdisk: Reducer<VDiskState, VDiskAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_VDISK.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_VDISK.SUCCESS: {
            const {vDiskData, groupData} = action.data;

            return {
                ...state,
                vDiskData,
                groupData,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_VDISK.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_VDISK_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        default:
            return state;
    }
};

export const setVDiskDataWasNotLoaded = () => {
    return {
        type: SET_VDISK_DATA_WAS_NOT_LOADED,
    } as const;
};

interface VDiskDataRequestParams {
    nodeId: number | string;
    pDiskId: number | string;
    vDiskSlotId: number | string;
}

const requestVDiskData = async ({nodeId, pDiskId, vDiskSlotId}: VDiskDataRequestParams) => {
    const vDiskDataResponse = await Promise.all([
        window.api.getVdiskInfo({nodeId, pDiskId, vDiskSlotId}),
        window.api.getPdiskInfo(nodeId, pDiskId),
        window.api.getNodeInfo(nodeId),
    ]);

    const vDiskData = prepareVDiskDataResponse(vDiskDataResponse);

    const {StoragePoolName, VDiskId = {}} = vDiskData;
    const {GroupID} = VDiskId;

    let groupData: VDiskGroup | undefined;

    if (valueIsDefined(StoragePoolName) && valueIsDefined(GroupID)) {
        const groupResponse = await window.api.getStorageInfo({
            nodeId,
            poolName: StoragePoolName,
            groupId: GroupID,
            version: EVersion.v1,
        });
        groupData = prepareVDiskGroupResponse(groupResponse, StoragePoolName, GroupID);
    }

    return {vDiskData, groupData};
};

export const getVDiskData = (params: VDiskDataRequestParams) => {
    return createApiRequest({
        request: requestVDiskData(params),
        actions: FETCH_VDISK,
    });
};

export default vdisk;
