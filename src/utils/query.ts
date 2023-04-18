import {YQLType} from '../types';
import type {
    AnyExecuteResponse,
    AnyExplainResponse,
    ExecuteModernResponse,
    KeyValueRow,
    ScanPlan,
    ScriptPlan,
} from '../types/api/query';
import type {IQueryResult} from '../types/store/query';

export enum QueryModes {
    scan = 'scan',
    script = 'script',
}

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
            Array.isArray(data) ||
            typeof data !== 'object' ||
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

const isExplainScriptPlan = (plan: ScriptPlan | ScanPlan): plan is ScriptPlan =>
    Boolean(plan && 'queries' in plan);

export const parseQueryExplainPlan = (plan: ScriptPlan | ScanPlan): ScanPlan => {
    if (isExplainScriptPlan(plan)) {
        if (!plan.queries || !plan.queries.length) {
            return {meta: plan.meta};
        }

        // Currently support only one resultset
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

export function prepareQueryError(error: any) {
    return (
        error.data?.error?.message ||
        error.message ||
        error.data ||
        error.statusText ||
        JSON.stringify(error)
    );
}
