import {FETCH_NODES_LIST} from '../../store/reducers/nodesList';

import type {ApiRequestAction} from '../../store/utils';
import type {IResponseError} from '../api/error';
import type {TEvNodesInfo} from '../api/nodesList';

export interface NodesListState {
    loading: boolean;
    wasLoaded: boolean;
    data?: TEvNodesInfo;
    error?: IResponseError;
}

export type NodesListAction = ApiRequestAction<
    typeof FETCH_NODES_LIST,
    TEvNodesInfo,
    IResponseError
>;

export type NodesMap = Map<number, string>;

export interface NodesListRootStateSlice {
    nodesList: NodesListState;
}
