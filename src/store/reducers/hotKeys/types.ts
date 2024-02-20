import type {IResponseError} from '../../../types/api/error';
import type {HotKey} from '../../../types/api/hotkeys';
import type {
    setHotKeysData,
    setHotKeysDataWasNotLoaded,
    setHotKeysError,
    setHotKeysLoading,
} from './hotKeys';

export interface HotKeysState {
    loading: boolean;
    wasLoaded: boolean;
    data: null | HotKey[];
    error?: IResponseError;
}

export type HotKeysAction =
    | ReturnType<typeof setHotKeysDataWasNotLoaded>
    | ReturnType<typeof setHotKeysLoading>
    | ReturnType<typeof setHotKeysData>
    | ReturnType<typeof setHotKeysError>;
