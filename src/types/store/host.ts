import {FETCH_HOST} from '../../store/reducers/host';

import type {ApiRequestAction} from '../../store/utils';
import type {IResponseError} from '../api/error';
import type {TSystemStateInfo} from '../api/nodes';
import type {TEvSystemStateResponse} from '../api/systemState';

export interface IHostState {
    loading: boolean;
    wasLoaded: boolean;
    data?: TSystemStateInfo;
    error?: IResponseError;
}

export type IHostAction = ApiRequestAction<
    typeof FETCH_HOST,
    TEvSystemStateResponse,
    IResponseError
>;

export interface IHostRootStateSlice {
    host: IHostState;
}
