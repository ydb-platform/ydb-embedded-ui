import type {IResponseError} from '../../../../types/api/error';
import type {ApiRequestAction} from '../../../utils';
import type {NodesPreparedEntity} from '../../nodes/types';
import {FETCH_TOP_NODES, setDataWasNotLoaded} from './topNodes';

export interface TopNodesState {
    loading: boolean;
    wasLoaded: boolean;
    data?: NodesPreparedEntity[];
    error?: IResponseError;
}

export interface TopNodesHandledResponse {
    Nodes?: NodesPreparedEntity[];
}

type TopNodesApiRequestAction = ApiRequestAction<
    typeof FETCH_TOP_NODES,
    TopNodesHandledResponse,
    IResponseError
>;

export type TopNodesAction = TopNodesApiRequestAction | ReturnType<typeof setDataWasNotLoaded>;

export interface TopNodesStateSlice {
    topNodes: TopNodesState;
}
