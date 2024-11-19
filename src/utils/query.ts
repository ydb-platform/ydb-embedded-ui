import {z} from 'zod';

import {YQLType} from '../types';
import type {
    ArrayRow,
    ColumnType,
    ErrorResponse,
    ExecuteResponse,
    ExplainResponse,
    KeyValueRow,
    QueryPlan,
    ScriptPlan,
} from '../types/api/query';
import type {
    IQueryResult,
    QueryMode,
    StatisticsMode,
    TracingLevel,
    TransactionMode,
} from '../types/store/query';

import {isAxiosResponse, isNetworkError} from './response';

export const TRANSACTION_MODES = {
    serializable: 'serializable-read-write',
    stalero: 'stale-read-only',
    onlinero: 'online-read-only',
    snapshot: 'snapshot-read-only',
    implicit: 'implicit',
} as const;

export const TRANSACTION_MODES_TITLES: Record<TransactionMode, string> = {
    [TRANSACTION_MODES.serializable]: 'Serializable',
    [TRANSACTION_MODES.stalero]: 'Stale Read-Only',
    [TRANSACTION_MODES.onlinero]: 'Online Read-Only',
    [TRANSACTION_MODES.snapshot]: 'Snapshot Read-Only',
    [TRANSACTION_MODES.implicit]: 'Implicit',
} as const;

export const STATISTICS_MODES = {
    none: 'none',
    basic: 'basic',
    full: 'full',
    profile: 'profile',
} as const;

export const STATISTICS_MODES_TITLES: Record<StatisticsMode, string> = {
    [STATISTICS_MODES.none]: 'None',
    [STATISTICS_MODES.full]: 'Full',
    [STATISTICS_MODES.basic]: 'Basic',
    [STATISTICS_MODES.profile]: 'Profile',
} as const;

export const TRACING_LEVELS = {
    off: 'off',
    toplevel: 'toplevel',
    basic: 'basic',
    detailed: 'detailed',
    diagnostic: 'diagnostic',
    trace: 'trace',
} as const;

export const TRACING_LEVELS_TITLES: Record<TracingLevel, string> = {
    [TRACING_LEVELS.off]: 'Off',
    [TRACING_LEVELS.toplevel]: 'TopLevel',
    [TRACING_LEVELS.basic]: 'Basic',
    [TRACING_LEVELS.detailed]: 'Detailed',
    [TRACING_LEVELS.diagnostic]: 'Diagnostic',
    [TRACING_LEVELS.trace]: 'Trace',
} as const;

export const QUERY_ACTIONS = {
    execute: 'execute',
    explain: 'explain',
} as const;

export const QUERY_MODES = {
    scan: 'scan',
    script: 'script',
    data: 'data',
    query: 'query',
    pg: 'pg',
} as const;

export const QUERY_MODES_TITLES: Record<QueryMode, string> = {
    scan: 'Scan',
    script: 'YQL Script',
    data: 'Data',
    query: 'YQL - QueryService',
    pg: 'PostgreSQL',
} as const;

export const QUERY_SYNTAX = {
    yql: 'yql_v1',
    pg: 'pg',
} as const;

// eslint-disable-next-line complexity
export const getColumnType = (type: string) => {
    switch (type.replace(/\?$/, '')) {
        case YQLType.Bool:
            return 'boolean';
        case YQLType.Int8:
        case YQLType.Int16:
        case YQLType.Int32:
        case YQLType.Int64:
        case YQLType.Uint8:
        case YQLType.Uint16:
        case YQLType.Uint32:
        case YQLType.Uint64:
        case YQLType.Float:
        case YQLType.Double:
        case YQLType.Decimal:
            return 'number';
        case YQLType.String:
        case YQLType.Utf8:
        case YQLType.Json:
        case YQLType.JsonDocument:
        case YQLType.Yson:
        case YQLType.Uuid:
            return 'string';
        case YQLType.Date:
        case YQLType.Datetime:
        case YQLType.Timestamp:
        case YQLType.Interval:
        case YQLType.TzDate:
        case YQLType.TzDateTime:
        case YQLType.TzTimestamp:
            return 'date';
        default:
            return undefined;
    }
};

/** parse response result from ArrayRow to KeyValueRow */
const parseResult = (rows: ArrayRow[], columns: ColumnType[]) => {
    return rows.map((row) => {
        return row.reduce<KeyValueRow>((newRow, cellData, columnIndex) => {
            const {name} = columns[columnIndex];
            newRow[name] = cellData;
            return newRow;
        }, {});
    });
};

const parseExecuteResponse = (data: ExecuteResponse): IQueryResult => {
    const {result, ...restData} = data;

    const parsedResult = result?.map((resultSet) => {
        const {rows, columns, truncated} = resultSet;

        let parsedRows: KeyValueRow[] | undefined;

        if (columns) {
            // Result shouldn't be null if there are columns
            parsedRows = [];
        }

        if (rows && columns) {
            parsedRows = parseResult(rows, columns);
        }

        return {
            columns: columns,
            result: parsedRows,
            truncated,
        };
    });

    return {
        resultSets: parsedResult, // use a separate field to make result compatible
        ...restData,
    };
};

const isSupportedExecuteResponse = (
    response: ExecuteResponse | ExplainResponse,
): response is ExecuteResponse =>
    Boolean(
        response &&
            !Array.isArray(response) &&
            'result' in response &&
            Array.isArray(response.result) &&
            typeof response.result[0] === 'object' &&
            'rows' in response.result[0] &&
            'columns' in response.result[0],
    );

type UnsupportedQueryResponseFormat =
    | Array<unknown>
    | string
    | null
    | undefined
    | {result: string | Record<string, unknown>};

const isUnsupportedType = (
    data: ExecuteResponse | ExplainResponse | UnsupportedQueryResponseFormat,
): data is UnsupportedQueryResponseFormat => {
    return Boolean(
        !data ||
            typeof data !== 'object' ||
            Array.isArray(data) ||
            ('result' in data && !Array.isArray(data.result)),
    );
};

export function isQueryErrorResponse(data: unknown): data is ErrorResponse {
    return Boolean(data && typeof data === 'object' && 'error' in data && 'issues' in data);
}

// Although schema is set in request, if schema is not supported default schema for the version will be used
// So we should additionally parse response
export function parseQueryAPIResponse(
    data: ExecuteResponse | ExplainResponse | UnsupportedQueryResponseFormat,
): IQueryResult {
    if (isUnsupportedType(data)) {
        return {};
    }

    if (isSupportedExecuteResponse(data)) {
        return parseExecuteResponse(data);
    }

    return data;
}

const isExplainScriptPlan = (plan: ScriptPlan | QueryPlan): plan is ScriptPlan =>
    Boolean(plan && 'queries' in plan);

export const parseQueryExplainPlan = (plan: ScriptPlan | QueryPlan): QueryPlan => {
    if (isExplainScriptPlan(plan)) {
        if (!plan.queries || !plan.queries.length) {
            return {meta: plan.meta};
        }

        return {
            Plan: plan.queries[0].Plan,
            tables: plan.queries[0].tables,
            meta: plan.meta,
            SimplifiedPlan: plan.queries[0].SimplifiedPlan,
        };
    }

    return plan;
};

export const prepareQueryResponse = (data?: KeyValueRow[]) => {
    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((row) => {
        const formattedData: KeyValueRow = {};

        for (const field in row) {
            if (Object.prototype.hasOwnProperty.call(row, field)) {
                const type = typeof row[field];

                // Although typeof null == 'object'
                // null result should be preserved
                if (
                    (row[field] !== null && type === 'object') ||
                    type === 'boolean' ||
                    Array.isArray(row[field])
                ) {
                    formattedData[field] = JSON.stringify(row[field]);
                } else {
                    formattedData[field] = row[field];
                }
            }
        }

        return formattedData;
    });
};

export const parseQueryError = (error: unknown): ErrorResponse | string | undefined => {
    if (typeof error === 'string' || isQueryErrorResponse(error)) {
        return error;
    }

    if (isNetworkError(error)) {
        return error.message;
    }

    if (isAxiosResponse(error)) {
        if ('data' in error && isQueryErrorResponse(error.data)) {
            return error.data;
        }

        return error.statusText;
    }

    return undefined;
};

export const parseQueryErrorToString = (error: unknown) => {
    const parsedError = parseQueryError(error);

    if (typeof parsedError === 'string') {
        return parsedError;
    }

    return parsedError?.error?.message;
};

export const DEFAULT_QUERY_SETTINGS = {
    queryMode: QUERY_MODES.query,
    transactionMode: TRANSACTION_MODES.implicit,
    timeout: 60,
    limitRows: 10000,
    statisticsMode: STATISTICS_MODES.none,
    tracingLevel: TRACING_LEVELS.off,
};

export const queryModeSchema = z.nativeEnum(QUERY_MODES);
export const transactionModeSchema = z.nativeEnum(TRANSACTION_MODES);
export const statisticsModeSchema = z.nativeEnum(STATISTICS_MODES);
export const tracingLevelSchema = z.nativeEnum(TRACING_LEVELS);
export const querySettingsValidationSchema = z.object({
    timeout: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.coerce.number().positive().or(z.undefined()),
    ),
    limitRows: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.coerce.number().gt(0).lte(10_000).or(z.undefined()),
    ),
    queryMode: queryModeSchema,
    transactionMode: transactionModeSchema,
    statisticsMode: statisticsModeSchema,
    tracingLevel: tracingLevelSchema,
});

export const querySettingsRestoreSchema = z
    .object({
        timeout: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.coerce.number().positive().optional().catch(DEFAULT_QUERY_SETTINGS.timeout),
        ),
        limitRows: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.coerce.number().gt(0).lte(10_000).optional().catch(DEFAULT_QUERY_SETTINGS.limitRows),
        ),
        queryMode: queryModeSchema.catch(DEFAULT_QUERY_SETTINGS.queryMode),
        transactionMode: transactionModeSchema.catch(DEFAULT_QUERY_SETTINGS.transactionMode),
        statisticsMode: statisticsModeSchema.catch(DEFAULT_QUERY_SETTINGS.statisticsMode),
        tracingLevel: tracingLevelSchema.catch(DEFAULT_QUERY_SETTINGS.tracingLevel),
    })
    .catch(DEFAULT_QUERY_SETTINGS);
