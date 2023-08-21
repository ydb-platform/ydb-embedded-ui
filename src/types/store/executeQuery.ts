import {
    SEND_QUERY,
    changeUserInput,
    saveQueryToHistory,
    goToPreviousQuery,
    setMonacoHotKey,
    goToNextQuery,
    setTenantPath,
    MONACO_HOT_KEY_ACTIONS,
} from '../../store/reducers/executeQuery';
import type {ApiRequestAction} from '../../store/utils';
import type {ValueOf} from '../common';
import type {IQueryResult, QueryError, QueryErrorResponse} from './query';

export type MonacoHotKeyAction = ValueOf<typeof MONACO_HOT_KEY_ACTIONS>;

export interface QueryInHistory {
    queryText: string;
    syntax?: string;
}

export interface ExecuteQueryState {
    loading: boolean;
    input: string;
    history: {
        // String type for backward compatibility
        queries: (QueryInHistory | string)[];
        currentIndex: number;
    };
    monacoHotKey: null | MonacoHotKeyAction;
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
    | ReturnType<typeof setMonacoHotKey>
    | ReturnType<typeof setTenantPath>;

export interface ExecuteQueryStateSlice {
    executeQuery: ExecuteQueryState;
}
