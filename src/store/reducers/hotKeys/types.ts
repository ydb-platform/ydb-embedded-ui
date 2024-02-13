import type {IResponseError} from '../../../types/api/error';
import type {HotKey, JsonHotKeysResponse} from '../../../types/api/hotkeys';
import type {ApiRequestAction} from '../../utils';
import {FETCH_HOT_KEYS, setHotKeysState} from './hotKeys';

export interface HotKeysState {
    loading: boolean;
    wasLoaded: boolean;
    data: null | HotKey[];
    error?: IResponseError;
}

export type HotKeysAction =
    | ApiRequestAction<typeof FETCH_HOT_KEYS, JsonHotKeysResponse, IResponseError>
    | ReturnType<typeof setHotKeysState>;
