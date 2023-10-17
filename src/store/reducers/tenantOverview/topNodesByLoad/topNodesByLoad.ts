import type {Reducer} from 'redux';

import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {createApiRequest, createRequestActionTypes} from '../../../utils';
import {prepareNodesData} from '../../nodes/utils';
import type {NodesApiRequestParams} from '../../nodes/types';
import type {TopNodesByLoadAction, TopNodesByLoadState, TopNodesByLoadStateSlice} from './types';

export const FETCH_TOP_NODES_BY_LOAD = createRequestActionTypes(
    'topNodesByLoad',
    'FETCH_TOP_NODES_BY_LOAD',
);
const SET_DATA_WAS_NOT_LOADED = 'topNodesByLoad/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
};

export const topNodesByLoad: Reducer<TopNodesByLoadState, TopNodesByLoadAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case FETCH_TOP_NODES_BY_LOAD.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TOP_NODES_BY_LOAD.SUCCESS: {
            return {
                ...state,
                data: action.data?.Nodes,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_TOP_NODES_BY_LOAD.FAILURE: {
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

const concurrentId = 'getTopNodesByLoad';

export function getTopNodesByLoad({
    type = 'any',
    sortOrder = -1,
    sortValue = 'LoadAverage',
    limit = TENANT_OVERVIEW_TABLES_LIMIT,
    ...params
}: NodesApiRequestParams) {
    return createApiRequest({
        request: window.api.getNodes(
            {type, sortOrder, sortValue, limit, ...params},
            {concurrentId},
        ),
        actions: FETCH_TOP_NODES_BY_LOAD,
        dataHandler: prepareNodesData,
    });
}

export const selectTopNodesByLoad = (state: TopNodesByLoadStateSlice) => state.topNodesByLoad.data;

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};
