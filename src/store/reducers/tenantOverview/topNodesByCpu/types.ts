import type {IResponseError} from '../../../../types/api/error';
import type {ApiRequestAction} from '../../../utils';
import type {NodesPreparedEntity} from '../../nodes/types';

import type {FETCH_TOP_NODES_BY_CPU, setDataWasNotLoaded} from './topNodesByCpu';

export interface TopNodesByCpuState {
    loading: boolean;
    wasLoaded: boolean;
    data?: NodesPreparedEntity[];
    error?: IResponseError;
}

export interface TopNodesByCpuHandledResponse {
    Nodes?: NodesPreparedEntity[];
}

type TopNodesByCpuApiRequestAction = ApiRequestAction<
    typeof FETCH_TOP_NODES_BY_CPU,
    TopNodesByCpuHandledResponse,
    IResponseError
>;

export type TopNodesByCpuAction =
    | TopNodesByCpuApiRequestAction
    | ReturnType<typeof setDataWasNotLoaded>;

export interface TopPoolsStateSlice {
    topNodesByCpu: TopNodesByCpuState;
}
