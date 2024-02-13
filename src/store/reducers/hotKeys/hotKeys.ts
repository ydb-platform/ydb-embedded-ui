import type {Reducer} from 'redux';
import {createRequestActionTypes, createApiRequest} from '../../utils';
import type {HotKeysAction, HotKeysState} from './types';

export const FETCH_HOT_KEYS = createRequestActionTypes('hot_keys', 'FETCH_HOT_KEYS');
const SET_HOT_KEYS_OPTIONS = 'hot_keys/SET_HOT_KEYS_OPTIONS';

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
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_HOT_KEYS_OPTIONS:
            return {
                ...state,
                ...action.data,
            };
        default:
            return state;
    }
};

export function getHotKeys(currentSchemaPath: string, enableSampling: boolean) {
    return createApiRequest({
        request: window.api.getHotKeys(currentSchemaPath, enableSampling),
        actions: FETCH_HOT_KEYS,
    });
}

export function setHotKeysState(newState: HotKeysState) {
    return {
        type: SET_HOT_KEYS_OPTIONS,
        data: newState,
    } as const;
}

export default hotKeys;
