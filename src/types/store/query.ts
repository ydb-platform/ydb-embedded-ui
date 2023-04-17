import type {NetworkError} from '../api/error';
import type {
    KeyValueRow,
    ColumnType,
    TKqpStatsQuery,
    ScanPlan,
    ScriptPlan,
    ErrorResponse,
} from '../api/query';

export interface IQueryResult {
    result?: KeyValueRow[];
    columns?: ColumnType[];
    stats?: TKqpStatsQuery;
    plan?: ScriptPlan | ScanPlan;
    ast?: string;
}

export type QueryError = NetworkError | ErrorResponse;
