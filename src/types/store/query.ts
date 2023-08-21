import {QUERY_ACTIONS, QUERY_MODES, QUERY_SYNTAX} from '../../utils/query';

import type {IResponseError, NetworkError} from '../api/error';
import type {
    KeyValueRow,
    ColumnType,
    ErrorResponse as QueryErrorResponseData,
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

export type QueryErrorResponse = IResponseError<QueryErrorResponseData>;
export type QueryError = NetworkError | QueryErrorResponse;

export type QueryAction = ValueOf<typeof QUERY_ACTIONS>;
export type QueryMode = ValueOf<typeof QUERY_MODES>;
export type QuerySyntax = ValueOf<typeof QUERY_SYNTAX>;

export interface SavedQuery {
    name: string;
    body: string;
}
