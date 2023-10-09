import type {Reducer} from 'redux';

import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {EVersion} from '../../../../types/api/compute';
import {createApiRequest, createRequestActionTypes} from '../../../utils';
import {prepareNodesData} from '../../nodes/utils';
import type {ComputeApiRequestParams, NodesApiRequestParams} from '../../nodes/types';
import type {TopPoolsAction, TopPoolsState, TopPoolsStateSlice} from './types';
import {prepareTopComputeNodesData} from './utils';

export const FETCH_TOP_POOLS = createRequestActionTypes('topPools', 'FETCH_TOP_POOLS');
const SET_DATA_WAS_NOT_LOADED = 'topPools/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
};

const topPools: Reducer<TopPoolsState, TopPoolsAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TOP_POOLS.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TOP_POOLS.SUCCESS: {
            return {
                ...state,
                data: action.data?.Nodes,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_TOP_POOLS.FAILURE: {
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

const concurrentId = 'getTopPools';

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
        actions: FETCH_TOP_POOLS,
        dataHandler: prepareNodesData,
    });
}

export function getTopComputeNodesByCpu({
    sortOrder = -1,
    sortValue = 'CPU',
    limit = TENANT_OVERVIEW_TABLES_LIMIT,
    version = EVersion.v2,
    ...params
}: ComputeApiRequestParams) {
    return createApiRequest({
        request: window.api.getCompute(
            {sortOrder, sortValue, limit, version, ...params},
            {concurrentId},
        ),
        actions: FETCH_TOP_POOLS,
        dataHandler: prepareTopComputeNodesData,
    });
}

export const selectTopPools = (state: TopPoolsStateSlice) => state.topPools.data;

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export default topPools;
