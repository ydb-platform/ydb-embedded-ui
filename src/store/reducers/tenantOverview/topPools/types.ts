import type {IResponseError} from '../../../../types/api/error';
import type {ApiRequestAction} from '../../../utils';
import type {NodesPreparedEntity} from '../../nodes/types';
import {FETCH_TOP_POOLS, setDataWasNotLoaded} from './topPools';

export interface TopPoolsState {
    loading: boolean;
    wasLoaded: boolean;
    data?: NodesPreparedEntity[];
    error?: IResponseError;
}

export interface TopPoolsHandledResponse {
    Nodes?: NodesPreparedEntity[];
}

type TopPoolsApiRequestAction = ApiRequestAction<
    typeof FETCH_TOP_POOLS,
    TopPoolsHandledResponse,
    IResponseError
>;

export type TopPoolsAction = TopPoolsApiRequestAction | ReturnType<typeof setDataWasNotLoaded>;

export interface TopPoolsStateSlice {
    topPools: TopPoolsState;
}
