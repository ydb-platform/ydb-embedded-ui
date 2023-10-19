import {FETCH_TOP_QUERIES, setTopQueriesState, setTopQueriesFilters} from './executeTopQueries';
import type {ApiRequestAction} from '../../utils';
import type {IQueryResult, QueryErrorResponse} from '../../../types/store/query';

export interface ITopQueriesFilters {
    /** ms from epoch */
    from?: number;
    /** ms from epoch */
    to?: number;
    text?: string;
}

export interface ITopQueriesState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: QueryErrorResponse;
    filters: ITopQueriesFilters;
}

export type ITopQueriesAction =
    | ApiRequestAction<typeof FETCH_TOP_QUERIES, IQueryResult, QueryErrorResponse>
    | ReturnType<typeof setTopQueriesState>
    | ReturnType<typeof setTopQueriesFilters>;

export interface ITopQueriesRootStateSlice {
    executeTopQueries: ITopQueriesState;
}
