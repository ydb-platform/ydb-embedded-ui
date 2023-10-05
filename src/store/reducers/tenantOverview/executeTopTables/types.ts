import type {IQueryResult, QueryErrorResponse} from '../../../../types/store/query';
import type {ApiRequestAction} from '../../../utils';
import {FETCH_TOP_TABLES, setTopTablesState} from './executeTopTables';

export interface TopTablesState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: QueryErrorResponse;
}

export type TopTablesAction =
    | ApiRequestAction<typeof FETCH_TOP_TABLES, IQueryResult, QueryErrorResponse>
    | ReturnType<typeof setTopTablesState>;
