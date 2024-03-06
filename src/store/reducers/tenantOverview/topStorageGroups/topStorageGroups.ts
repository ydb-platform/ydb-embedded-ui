import type {Reducer} from '@reduxjs/toolkit';

import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {EVersion} from '../../../../types/api/storage';
import {createApiRequest, createRequestActionTypes} from '../../../utils';
import type {StorageApiRequestParams} from '../../storage/types';
import type {
    TopStorageGroupsAction,
    TopStorageGroupsState,
    TopStorageGroupsStateSlice,
} from './types';
import {prepareTopStorageGroupsResponse} from './utils';

export const FETCH_TOP_STORAGE_GROUPS = createRequestActionTypes(
    'topStorageGroups',
    'FETCH_TOP_STORAGE_GROUPS',
);

const SET_DATA_WAS_NOT_LOADED = 'topStorageGroups/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: true,
    wasLoaded: false,
};

const topStorageGroups: Reducer<TopStorageGroupsState, TopStorageGroupsAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case FETCH_TOP_STORAGE_GROUPS.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TOP_STORAGE_GROUPS.SUCCESS: {
            return {
                ...state,
                data: action.data.groups,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_TOP_STORAGE_GROUPS.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
                wasLoaded: true,
            };
        }
        case SET_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        default:
            return state;
    }
};

export const getTopStorageGroups = ({
    tenant,
    visibleEntities = 'all',
    nodeId,
    sortOrder = -1,
    sortValue = 'Usage',
    limit = TENANT_OVERVIEW_TABLES_LIMIT,
    version = EVersion.v2,
    ...params
}: StorageApiRequestParams) => {
    return createApiRequest({
        request: window.api.getStorageInfo(
            {tenant, visibleEntities, nodeId, version, sortOrder, sortValue, limit, ...params},
            {concurrentId: 'getTopStorageGroups'},
        ),
        actions: FETCH_TOP_STORAGE_GROUPS,
        dataHandler: prepareTopStorageGroupsResponse,
    });
};

export const selectTopStorageGroups = (state: TopStorageGroupsStateSlice) =>
    state.topStorageGroups.data;

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export default topStorageGroups;
