import {FETCH_TOP_QUERIES, setTopQueriesState} from '../../store/reducers/executeTopQueries';
import type {ApiRequestAction} from '../../store/utils';
import type {IResponseError} from '../api/error';
import type {IQueryResult} from './query';

export interface ITopQueriesState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: IResponseError;
}

export type ITopQueriesAction =
    | ApiRequestAction<typeof FETCH_TOP_QUERIES, IQueryResult, IResponseError>
    | ReturnType<typeof setTopQueriesState>;

export interface ITopQueriesRootStateSlice {
    executeTopQueries: ITopQueriesState;
}
