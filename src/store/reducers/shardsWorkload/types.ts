import type {IQueryResult, QueryErrorResponse} from '../../../types/store/query';
import type {ApiRequestAction} from '../../utils';

import type {SEND_SHARD_QUERY, setShardsQueryFilters, setShardsState} from './shardsWorkload';

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
