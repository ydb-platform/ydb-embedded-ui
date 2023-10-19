import {SEND_SHARD_QUERY, setShardsState, setShardsQueryFilters} from './shardsWorkload';
import type {ApiRequestAction} from '../../utils';
import type {IQueryResult, QueryErrorResponse} from '../../../types/store/query';

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
    error?: QueryErrorResponse;
    filters: IShardsWorkloadFilters;
}

export type IShardsWorkloadAction =
    | ApiRequestAction<typeof SEND_SHARD_QUERY, IQueryResult, QueryErrorResponse>
    | ReturnType<typeof setShardsState>
    | ReturnType<typeof setShardsQueryFilters>;

export interface IShardsWorkloadRootStateSlice {
    shardsWorkload: IShardsWorkloadState;
}
