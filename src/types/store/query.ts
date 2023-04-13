import type {KeyValueRow, ColumnType, TKqpStatsQuery, ScanPlan, ScriptPlan} from '../api/query';

export interface IQueryResult {
    result?: KeyValueRow[];
    columns?: ColumnType[];
    stats?: TKqpStatsQuery;
    plan?: ScriptPlan | ScanPlan;
    ast?: string;
}
