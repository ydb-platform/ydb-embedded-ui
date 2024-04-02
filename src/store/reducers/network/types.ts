import type {IResponseError} from '../../../types/api/error';
import type {TNetInfo} from '../../../types/api/netInfo';
import type {ApiRequestAction} from '../../utils';

import type {FETCH_ALL_NODES_NETWORK, setDataWasNotLoaded} from './network';

export interface NetworkState {
    loading: boolean;
    wasLoaded: boolean;
    data?: TNetInfo;
    error?: IResponseError;
}

export type NetworkAction =
    | ApiRequestAction<typeof FETCH_ALL_NODES_NETWORK, TNetInfo, IResponseError>
    | ReturnType<typeof setDataWasNotLoaded>;
