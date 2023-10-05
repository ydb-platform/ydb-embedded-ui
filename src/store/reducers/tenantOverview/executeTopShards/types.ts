import type {IQueryResult, QueryErrorResponse} from '../../../../types/store/query';
import type {ApiRequestAction} from '../../../utils';
import {FETCH_TOP_SHARDS, setDataWasNotLoaded} from './executeTopShards';

export interface TopShardsState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: QueryErrorResponse;
}

export type TopShardsAction =
    | ApiRequestAction<typeof FETCH_TOP_SHARDS, IQueryResult, QueryErrorResponse>
    | ReturnType<typeof setDataWasNotLoaded>;

export interface TopShardsSlice {
    topShards: TopShardsState;
}
