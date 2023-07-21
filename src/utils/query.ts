import {YQLType} from '../types';
import type {
    AnyExecuteResponse,
    AnyExplainResponse,
    ExecuteModernResponse,
    KeyValueRow,
    QueryPlan,
    ScriptPlan,
} from '../types/api/query';
import type {IQueryResult, QueryErrorResponse} from '../types/store/query';

export const QUERY_ACTIONS = {
    execute: 'execute',
    explain: 'explain',
} as const;

export const QUERY_MODES = {
    scan: 'scan',
    script: 'script',
    data: 'data',
    query: 'query',
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

/** parse response result field from ArrayRow to KeyValueRow */
const parseExecuteModernResponse = (data: ExecuteModernResponse): IQueryResult => {
    const {result, columns, ...restData} = data;

    return {
        result:
            result &&
            columns &&
            result.map((row) => {
                return row.reduce((newRow, cellData, columnIndex) => {
                    const {name} = columns[columnIndex];
                    newRow[name] = cellData;
                    return newRow;
                }, {} as KeyValueRow);
            }),
        columns,
        ...restData,
    };
};

const isModern = (response: AnyExecuteResponse): response is ExecuteModernResponse =>
    Boolean(
        response &&
            !Array.isArray(response) &&
            Array.isArray((response as ExecuteModernResponse).result) &&
            Array.isArray((response as ExecuteModernResponse).columns),
    );

type UnsupportedQueryResponseFormat =
    | Array<unknown>
    | string
    | null
    | undefined
    | {result: string | Record<string, unknown>};

const isUnsupportedType = (
    data: AnyExecuteResponse | AnyExplainResponse | UnsupportedQueryResponseFormat,
): data is UnsupportedQueryResponseFormat => {
    return Boolean(
        !data ||
            typeof data !== 'object' ||
            Array.isArray(data) ||
            ('result' in data && !Array.isArray(data.result)),
    );
};

export const parseQueryAPIExecuteResponse = (
    data: AnyExecuteResponse | UnsupportedQueryResponseFormat,
): IQueryResult => {
    if (isUnsupportedType(data)) {
        return {};
    }
    if (isModern(data)) {
        return parseExecuteModernResponse(data);
    }

    return data;
};

export const parseQueryAPIExplainResponse = (
    data: AnyExplainResponse | UnsupportedQueryResponseFormat,
): IQueryResult => {
    if (isUnsupportedType(data)) {
        return {};
    }

    return data;
};

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
                if (type === 'object' || type === 'boolean' || Array.isArray(row[field])) {
                    formattedData[field] = JSON.stringify(row[field]);
                } else {
                    formattedData[field] = row[field];
                }
            }
        }

        return formattedData;
    });
};

export function prepareQueryError(error: QueryErrorResponse) {
    return error.data?.error?.message || error.statusText;
}
