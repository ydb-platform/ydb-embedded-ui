import type {NetworkError} from '../api/error';
import type {KeyValueRow, ColumnType, ErrorResponse} from '../api/query';

export interface IQueryResult {
    result?: KeyValueRow[];
    columns?: ColumnType[];
    stats?: any;
    plan?: any;
    ast?: string;
}

export interface QueryRequestParams {
    database: string;
    query: string;
}

export type QueryError = NetworkError | ErrorResponse;
