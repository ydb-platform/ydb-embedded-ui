import type {z} from 'zod';

import type {
    QUERY_ACTIONS,
    QUERY_MODES,
    QUERY_SYNTAX,
    STATISTICS_MODES,
    TRACING_LEVELS,
    TRANSACTION_MODES,
    querySettingsValidationSchema,
} from '../../utils/query';
import type {IResponseError, NetworkError} from '../api/error';
import type {
    ColumnType,
    KeyValueRow,
    ErrorResponse as QueryErrorResponseData,
    QueryPlan,
    ScriptPlan,
    TKqpStatsQuery,
} from '../api/query';
import type {ValueOf} from '../common';

export interface ParsedResultSet {
    columns?: ColumnType[];
    result?: KeyValueRow[];
    truncated?: boolean;
}

export interface IQueryResult {
    resultSets?: ParsedResultSet[];
    columns?: ColumnType[];
    stats?: TKqpStatsQuery;
    plan?: ScriptPlan | QueryPlan;
    ast?: string;
    traceId?: string;
    truncated?: boolean;
}

export interface QueryRequestParams {
    database: string;
    query: string;
}

export type QuerySettings = z.infer<typeof querySettingsValidationSchema>;

export type QueryErrorResponse = IResponseError<QueryErrorResponseData>;
export type QueryError = NetworkError | QueryErrorResponse;

export type QueryAction = ValueOf<typeof QUERY_ACTIONS>;
export type QueryMode = ValueOf<typeof QUERY_MODES>;
export type QuerySyntax = ValueOf<typeof QUERY_SYNTAX>;

export type TransactionMode = ValueOf<typeof TRANSACTION_MODES>;
export type StatisticsMode = ValueOf<typeof STATISTICS_MODES>;
export type TracingLevel = ValueOf<typeof TRACING_LEVELS>;

export interface SavedQuery {
    name: string;
    body: string;
}
