import type {Reducer} from '@reduxjs/toolkit';

import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {createApiRequest, createRequestActionTypes} from '../../../utils';
import type {NodesApiRequestParams} from '../../nodes/types';
import {prepareNodesData} from '../../nodes/utils';

import type {TopNodesByCpuAction, TopNodesByCpuState, TopPoolsStateSlice} from './types';

export const FETCH_TOP_NODES_BY_CPU = createRequestActionTypes(
    'topNodesByCpu',
    'FETCH_TOP_NODES_BY_CPU',
);
const SET_DATA_WAS_NOT_LOADED = 'topNodesByCpu/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
};

export const topNodesByCpu: Reducer<TopNodesByCpuState, TopNodesByCpuAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case FETCH_TOP_NODES_BY_CPU.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TOP_NODES_BY_CPU.SUCCESS: {
            return {
                ...state,
                data: action.data?.Nodes,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_TOP_NODES_BY_CPU.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
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

const concurrentId = 'getTopNodeByCpu';

export function getTopNodesByCpu({
    type = 'any',
    sortOrder = -1,
    sortValue = 'CPU',
    limit = TENANT_OVERVIEW_TABLES_LIMIT,
    ...params
}: NodesApiRequestParams) {
    return createApiRequest({
        request: window.api.getNodes(
            {type, sortOrder, sortValue, limit, ...params},
            {concurrentId},
        ),
        actions: FETCH_TOP_NODES_BY_CPU,
        dataHandler: prepareNodesData,
    });
}

export const selectTopNodesByCpu = (state: TopPoolsStateSlice) => state.topNodesByCpu.data;

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};
