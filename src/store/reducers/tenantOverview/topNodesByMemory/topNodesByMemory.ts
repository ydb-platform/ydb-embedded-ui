import type {Reducer} from '@reduxjs/toolkit';

import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {createApiRequest, createRequestActionTypes} from '../../../utils';
import {prepareNodesData} from '../../nodes/utils';
import type {NodesApiRequestParams} from '../../nodes/types';
import type {TopNodesByMemoryAction, TopNodesByMemoryState, TopNodesByMemorySlice} from './types';

export const FETCH_TOP_NODES_BY_MEMORY = createRequestActionTypes(
    'topNodesByMemory',
    'FETCH_TOP_NODES_BY_MEMORY',
);
const SET_DATA_WAS_NOT_LOADED = 'topNodesByMemory/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
};

export const topNodesByMemory: Reducer<TopNodesByMemoryState, TopNodesByMemoryAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case FETCH_TOP_NODES_BY_MEMORY.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TOP_NODES_BY_MEMORY.SUCCESS: {
            return {
                ...state,
                data: action.data?.Nodes,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_TOP_NODES_BY_MEMORY.FAILURE: {
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

const concurrentId = 'getTopNodeByMemory';

export function getTopNodesByMemory({
    type = 'any',
    sortOrder = -1,
    sortValue = 'Memory',
    limit = TENANT_OVERVIEW_TABLES_LIMIT,
    ...params
}: NodesApiRequestParams) {
    return createApiRequest({
        request: window.api.getNodes(
            {type, sortOrder, sortValue, limit, ...params},
            {concurrentId},
        ),
        actions: FETCH_TOP_NODES_BY_MEMORY,
        dataHandler: prepareNodesData,
    });
}

export const selectTopNodesByMemory = (state: TopNodesByMemorySlice) => state.topNodesByMemory.data;

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};
