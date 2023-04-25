import type {NetworkError} from '../api/error';
import type {
    KeyValueRow,
    ColumnType,
    ErrorResponse,
    ScriptPlan,
    ScanPlan,
    TKqpStatsQuery,
} from '../api/query';

export interface IQueryResult {
    result?: KeyValueRow[];
    columns?: ColumnType[];
    stats?: TKqpStatsQuery;
    plan?: ScriptPlan | ScanPlan;
    ast?: string;
}

export interface QueryRequestParams {
    database: string;
    query: string;
}

export type QueryError = NetworkError | ErrorResponse;
