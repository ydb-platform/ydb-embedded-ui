import {SEND_SHARD_QUERY, setShardsState, setShardsQueryFilters} from '../../store/reducers/shardsWorkload';
import type {ApiRequestAction} from '../../store/utils';
import type {IResponseError} from '../api/error';
import type {IQueryResult} from './query';

export enum EShardsWorkloadMode {
    Immediate = 'immediate',
    History = 'history',
}

export interface IShardsWorkloadFilters {
    /** ms from epoch */
    from?: number;
    /** ms from epoch */
    to?: number;
    mode?: EShardsWorkloadMode;
}

export interface IShardsWorkloadState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: IResponseError;
    filters: IShardsWorkloadFilters;
}

export type IShardsWorkloadAction =
    | ApiRequestAction<typeof SEND_SHARD_QUERY, IQueryResult, IResponseError>
    | ReturnType<typeof setShardsState>
    | ReturnType<typeof setShardsQueryFilters>;

export interface IShardsWorkloadRootStateSlice {
    shardsWorkload: IShardsWorkloadState;
}
