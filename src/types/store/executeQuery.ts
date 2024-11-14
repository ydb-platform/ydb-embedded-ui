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

interface CommonResultParams {
    queryId: string;
    isLoading: boolean;
}

export type ExecuteQueryResult = {
    type: ResultType.EXECUTE;
    data?: IQueryResult;
    error?: unknown;
    isTraceReady?: true;
} & CommonResultParams;

export type ExplainQueryResult = {
    type: ResultType.EXPLAIN;
    data?: PreparedExplainResponse;
    error?: unknown;
} & CommonResultParams;

export type QueryResult = ExecuteQueryResult | ExplainQueryResult;

export interface ExecuteQueryState {
    input: string;
    result?: QueryResult & {isTraceReady?: boolean};
    history: {
        // String type for backward compatibility
        queries: QueryInHistory[];
        currentIndex: number;
        filter?: string;
    };
    tenantPath?: string;
}
