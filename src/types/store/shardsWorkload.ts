import {SEND_SHARD_QUERY, setShardQueryOptions} from '../../store/reducers/shardsWorkload';
import type {ApiRequestAction} from '../../store/utils';
import type {IResponseError} from '../api/error';
import type {IQueryResult} from './query';

export interface IShardsWorkloadState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: IResponseError;
}

export type IShardsWorkloadAction =
    | ApiRequestAction<typeof SEND_SHARD_QUERY, IQueryResult, IResponseError>
    | ReturnType<typeof setShardQueryOptions>;

export interface IShardsWorkloadRootStateSlice {
    shardsWorkload: IShardsWorkloadState;
}
