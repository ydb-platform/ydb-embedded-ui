import type {IQueryResult, QueryErrorResponse} from '../../../../types/store/query';
import type {ApiRequestAction} from '../../../utils';
import {FETCH_TOP_QUERIES, setDataWasNotLoaded} from './executeTopQueries';

export interface TopQueriesState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: QueryErrorResponse;
}

export type TopQueriesAction =
    | ApiRequestAction<typeof FETCH_TOP_QUERIES, IQueryResult, QueryErrorResponse>
    | ReturnType<typeof setDataWasNotLoaded>;

export interface TopQueriesSlice {
    executeTopQueries: TopQueriesState;
}
