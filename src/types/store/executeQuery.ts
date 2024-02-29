import {
    SEND_QUERY,
    changeUserInput,
    saveQueryToHistory,
    goToPreviousQuery,
    goToNextQuery,
    setTenantPath,
} from '../../store/reducers/executeQuery';
import type {ApiRequestAction} from '../../store/utils';
import type {IQueryResult, QueryError, QueryErrorResponse} from './query';

export interface QueryInHistory {
    queryText: string;
    syntax?: string;
}

export interface ExecuteQueryState {
    loading: boolean;
    input: string;
    history: {
        // String type for backward compatibility
        queries: QueryInHistory[];
        currentIndex: number;
    };
    tenantPath?: string;
    data?: IQueryResult;
    stats?: IQueryResult['stats'];
    error?: string | QueryErrorResponse;
}

type SendQueryAction = ApiRequestAction<typeof SEND_QUERY, IQueryResult, QueryError>;

export type ExecuteQueryAction =
    | SendQueryAction
    | ReturnType<typeof goToNextQuery>
    | ReturnType<typeof goToPreviousQuery>
    | ReturnType<typeof changeUserInput>
    | ReturnType<typeof saveQueryToHistory>
    | ReturnType<typeof setTenantPath>;

export interface ExecuteQueryStateSlice {
    executeQuery: ExecuteQueryState;
}
