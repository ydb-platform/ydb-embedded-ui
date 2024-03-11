import type {Reducer} from '@reduxjs/toolkit';

import type {IHostAction, IHostState} from '../../types/store/host';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_HOST = createRequestActionTypes('host', 'FETCH_HOST');

const initialState = {loading: true, wasLoaded: false, data: {}};

const host: Reducer<IHostState, IHostAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_HOST.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_HOST.SUCCESS: {
            return {
                ...state,
                data: action.data.SystemStateInfo?.[0],
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_HOST.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        default:
            return state;
    }
};

export function getHostInfo() {
    return createApiRequest({
        request: window.api.getHostInfo(),
        actions: FETCH_HOST,
    });
}

export default host;
