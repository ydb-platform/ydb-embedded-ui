import type {IResponseError} from '../../../../types/api/error';
import type {ApiRequestAction} from '../../../utils';
import type {NodesPreparedEntity} from '../../nodes/types';
import {FETCH_TOP_NODES_BY_LOAD, setDataWasNotLoaded} from './topNodesByLoad';

export interface TopNodesByLoadState {
    loading: boolean;
    wasLoaded: boolean;
    data?: NodesPreparedEntity[];
    error?: IResponseError;
}

export interface TopNodesByLoadHandledResponse {
    Nodes?: NodesPreparedEntity[];
}

type TopNodesByLoadApiRequestAction = ApiRequestAction<
    typeof FETCH_TOP_NODES_BY_LOAD,
    TopNodesByLoadHandledResponse,
    IResponseError
>;

export type TopNodesByLoadAction =
    | TopNodesByLoadApiRequestAction
    | ReturnType<typeof setDataWasNotLoaded>;

export interface TopNodesByLoadStateSlice {
    topNodesByLoad: TopNodesByLoadState;
}
