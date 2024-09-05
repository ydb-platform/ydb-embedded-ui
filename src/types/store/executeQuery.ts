import type {
    changeUserInput,
    goToNextQuery,
    goToPreviousQuery,
    saveQueryToHistory,
    setQueryHistoryFilter,
    setTenantPath,
    updateQueryInHistory,
    updateQueryResult,
} from '../../store/reducers/executeQuery';
import type {PreparedExplainResponse} from '../../store/reducers/explainQuery/types';

import type {IQueryResult} from './query';

export interface QueryInHistory {
    queryId?: string;
    queryText: string;
    syntax?: string;
    endTime?: string | number;
    durationUs?: string | number;
}

export enum ResultType {
    EXECUTE = 'execute',
    EXPLAIN = 'explain',
}

export type ExecuteQueryResult =
    | {
          type: ResultType.EXECUTE;
          data?: IQueryResult;
          error?: unknown;
      }
    | {
          type: ResultType.EXPLAIN;
          data?: PreparedExplainResponse;
          error?: unknown;
      };

export interface ExecuteQueryState {
    loading: boolean;
    input: string;
    result?: ExecuteQueryResult;
    history: {
        // String type for backward compatibility
        queries: QueryInHistory[];
        currentIndex: number;
        filter?: string;
    };
    tenantPath?: string;
}

export type ExecuteQueryAction =
    | ReturnType<typeof goToNextQuery>
    | ReturnType<typeof goToPreviousQuery>
    | ReturnType<typeof changeUserInput>
    | ReturnType<typeof updateQueryResult>
    | ReturnType<typeof saveQueryToHistory>
    | ReturnType<typeof updateQueryInHistory>
    | ReturnType<typeof setTenantPath>
    | ReturnType<typeof setQueryHistoryFilter>;

export interface ExecuteQueryStateSlice {
    executeQuery: ExecuteQueryState;
}
