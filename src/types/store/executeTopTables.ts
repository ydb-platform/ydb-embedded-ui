import {FETCH_TOP_TABLES, setTopTablesState} from '../../store/reducers/executeTopTables';
import {ApiRequestAction} from '../../store/utils';
import {IQueryResult, QueryErrorResponse} from './query';

export interface TopTablesState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: QueryErrorResponse;
}

export type TopTablesAction =
    | ApiRequestAction<typeof FETCH_TOP_TABLES, IQueryResult, QueryErrorResponse>
    | ReturnType<typeof setTopTablesState>;

export interface TopTablesRootStateSlice {
    topTables: TopTablesState;
}
