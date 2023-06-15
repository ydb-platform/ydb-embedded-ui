import type {NetworkError} from '../api/error';
import type {
    KeyValueRow,
    ColumnType,
    ErrorResponse,
    ScriptPlan,
    QueryPlan,
    TKqpStatsQuery,
} from '../api/query';

export interface IQueryResult {
    result?: KeyValueRow[];
    columns?: ColumnType[];
    stats?: TKqpStatsQuery;
    plan?: ScriptPlan | QueryPlan;
    ast?: string;
}

export interface QueryRequestParams {
    database: string;
    query: string;
}

export type QueryError = NetworkError | ErrorResponse;

export enum QueryModes {
    scan = 'scan',
    script = 'script',
    data = 'data',
    query = 'query',
}

export interface SavedQuery {
    name: string;
    body: string;
}
