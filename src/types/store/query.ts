import {QUERY_ACTIONS, QUERY_MODES} from '../../utils/query';

import type {NetworkError} from '../api/error';
import type {
    KeyValueRow,
    ColumnType,
    ErrorResponse,
    ScriptPlan,
    QueryPlan,
    TKqpStatsQuery,
} from '../api/query';
import type {ValueOf} from '../common';

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

export type QueryAction = ValueOf<typeof QUERY_ACTIONS>;
export type QueryMode = ValueOf<typeof QUERY_MODES>;

export interface SavedQuery {
    name: string;
    body: string;
}
