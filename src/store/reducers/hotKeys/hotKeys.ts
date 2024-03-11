import type {Reducer} from '@reduxjs/toolkit';

import type {JsonHotKeysResponse} from '../../../types/api/hotkeys';
import type {IResponseError} from '../../../types/api/error';

import {createRequestActionTypes} from '../../utils';
import type {HotKeysAction, HotKeysState} from './types';

export const FETCH_HOT_KEYS = createRequestActionTypes('hot_keys', 'FETCH_HOT_KEYS');
const SET_DATA_WAS_NOT_LOADED = 'hot_keys/SET_DATA_WAS_NOT_LOADED';

const initialState = {loading: true, wasLoaded: false, data: null};

const hotKeys: Reducer<HotKeysState, HotKeysAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_HOT_KEYS.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_HOT_KEYS.SUCCESS: {
            return {
                ...state,
                data: action.data.hotkeys,
                loading: false,
                error: undefined,
                wasLoaded: true,
            };
        }
        case FETCH_HOT_KEYS.FAILURE: {
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

export function setHotKeysDataWasNotLoaded() {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
}
export function setHotKeysLoading() {
    return {
        type: FETCH_HOT_KEYS.REQUEST,
    } as const;
}
export function setHotKeysData(data: JsonHotKeysResponse) {
    return {
        type: FETCH_HOT_KEYS.SUCCESS,
        data: data,
    } as const;
}
export function setHotKeysError(error: IResponseError) {
    return {
        type: FETCH_HOT_KEYS.FAILURE,
        error: error,
    } as const;
}

export default hotKeys;
