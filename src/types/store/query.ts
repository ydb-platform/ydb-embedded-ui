import type {KeyValueRow, ColumnType} from '../api/query';

export interface IQueryResult {
    result?: KeyValueRow[];
    columns?: ColumnType[];
    stats?: any;
    plan?: any;
    ast?: any;
}
