import type {Reducer} from '@reduxjs/toolkit';

import {createApiRequest, createRequestActionTypes} from '../../utils';

import type {NetworkAction, NetworkState} from './types';

export const FETCH_ALL_NODES_NETWORK = createRequestActionTypes(
    'network',
    'FETCH_ALL_NODES_NETWORK',
);

const SET_DATA_WAS_NOT_LOADED = 'network/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
};

const network: Reducer<NetworkState, NetworkAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_ALL_NODES_NETWORK.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_ALL_NODES_NETWORK.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_ALL_NODES_NETWORK.FAILURE: {
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

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export const getNetworkInfo = (tenant: string) => {
    return createApiRequest({
        request: window.api.getNetwork(tenant),
        actions: FETCH_ALL_NODES_NETWORK,
    });
};

export default network;
