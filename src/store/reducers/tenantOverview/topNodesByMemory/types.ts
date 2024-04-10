import type {IResponseError} from '../../../../types/api/error';
import type {ApiRequestAction} from '../../../utils';
import type {NodesPreparedEntity} from '../../nodes/types';

import type {FETCH_TOP_NODES_BY_MEMORY, setDataWasNotLoaded} from './topNodesByMemory';

export interface TopNodesByMemoryState {
    loading: boolean;
    wasLoaded: boolean;
    data?: NodesPreparedEntity[];
    error?: IResponseError;
}

export interface TopNodesByMemoryHandledResponse {
    Nodes?: NodesPreparedEntity[];
}

type TopNodesByMemoryApiRequestAction = ApiRequestAction<
    typeof FETCH_TOP_NODES_BY_MEMORY,
    TopNodesByMemoryHandledResponse,
    IResponseError
>;

export type TopNodesByMemoryAction =
    | TopNodesByMemoryApiRequestAction
    | ReturnType<typeof setDataWasNotLoaded>;

export interface TopNodesByMemorySlice {
    topNodesByMemory: TopNodesByMemoryState;
}
