import {FETCH_NODES_LIST} from '../../store/reducers/nodesList';

import type {ApiRequestAction} from '../../store/utils';
import type {IResponseError} from '../api/error';
import type {TSystemStateInfo} from '../api/nodes';

export interface NodesListState {
    loading: boolean;
    wasLoaded: boolean;
    data?: TSystemStateInfo[];
    error?: IResponseError;
}

export type NodesListAction = ApiRequestAction<
    typeof FETCH_NODES_LIST,
    TSystemStateInfo[],
    IResponseError
>;
