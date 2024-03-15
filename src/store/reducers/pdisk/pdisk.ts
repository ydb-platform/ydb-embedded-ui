import type {Reducer} from '@reduxjs/toolkit';

import {EVersion} from '../../../types/api/storage';
import {createRequestActionTypes, createApiRequest} from '../../utils';
import type {PDiskAction, PDiskState} from './types';
import {preparePDiksDataResponse, preparePDiskStorageResponse} from './utils';

export const FETCH_PDISK = createRequestActionTypes('pdisk', 'FETCH_PDISK');
export const FETCH_PDISK_GROUPS = createRequestActionTypes('pdisk', 'FETCH_PDISK_GROUPS');
const SET_PDISK_DATA_WAS_NOT_LOADED = 'pdisk/SET_PDISK_DATA_WAS_NOT_LOADED';

const initialState = {
    pDiskLoading: false,
    pDiskWasLoaded: false,
    pDiskData: {},
    groupsLoading: false,
    groupsWasLoaded: false,
    groupsData: [],
};

const pdisk: Reducer<PDiskState, PDiskAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_PDISK.REQUEST: {
            return {
                ...state,
                pDiskLoading: true,
            };
        }
        case FETCH_PDISK.SUCCESS: {
            return {
                ...state,
                pDiskData: action.data,
                pDiskLoading: false,
                pDiskWasLoaded: true,
                pDiskError: undefined,
            };
        }
        case FETCH_PDISK.FAILURE: {
            return {
                ...state,
                pDiskError: action.error,
                pDiskLoading: false,
            };
        }
        case FETCH_PDISK_GROUPS.REQUEST: {
            return {
                ...state,
                groupsLoading: true,
            };
        }
        case FETCH_PDISK_GROUPS.SUCCESS: {
            return {
                ...state,
                groupsData: action.data,
                groupsLoading: false,
                groupsWasLoaded: true,
                groupsError: undefined,
            };
        }
        case FETCH_PDISK_GROUPS.FAILURE: {
            return {
                ...state,
                groupsError: action.error,
                groupsLoading: false,
            };
        }
        case SET_PDISK_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                pDiskWasLoaded: false,
                groupsWasLoaded: false,
            };
        }
        default:
            return state;
    }
};

export const setPDiskDataWasNotLoaded = () => {
    return {
        type: SET_PDISK_DATA_WAS_NOT_LOADED,
    } as const;
};

export const getPDiskData = ({
    nodeId,
    pDiskId,
}: {
    nodeId: number | string;
    pDiskId: number | string;
}) => {
    return createApiRequest({
        request: Promise.all([
            window.api.getPdiskInfo(nodeId, pDiskId),
            window.api.getNodeInfo(nodeId),
        ]),
        actions: FETCH_PDISK,
        dataHandler: preparePDiksDataResponse,
    });
};

export const getPDiskStorage = ({
    nodeId,
    pDiskId,
}: {
    nodeId: number | string;
    pDiskId: number | string;
}) => {
    return createApiRequest({
        request: window.api.getStorageInfo({nodeId, version: EVersion.v1}),
        actions: FETCH_PDISK_GROUPS,
        dataHandler: (data) => preparePDiskStorageResponse(data, pDiskId, nodeId),
    });
};

export default pdisk;
