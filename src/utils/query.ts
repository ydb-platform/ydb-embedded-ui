import {YQLType} from '../types';
import type {
    AnyExecuteResponse,
    AnyExplainResponse,
    AnyResponse,
    CommonFields,
    DeepExecuteResponse,
    DeprecatedExecuteResponsePlain,
    ExecuteClassicResponsePlain,
    ExecuteModernResponse,
    KeyValueRow,
} from '../types/api/query';
import type {IQueryResult} from '../types/store/query';

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

const parseExecuteModernResponse = (data: ExecuteModernResponse): IQueryResult => {
    const {result, columns, ...restData} = data;

    return {
        result:
            result &&
            columns &&
            result.map((row) => {
                return row.reduce((newRow: KeyValueRow, cellData, columnIndex) => {
                    const {name} = columns[columnIndex];
                    newRow[name] = cellData;
                    return newRow;
                }, {});
            }),
        columns,
        ...restData,
    };
};

const parseDeprecatedExecuteResponseValue = (
    data?: DeprecatedExecuteResponsePlain | ExecuteClassicResponsePlain,
): KeyValueRow[] | undefined => {
    if (!data) {
        return undefined;
    }

    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            return undefined;
        }
    }

    if (Array.isArray(data)) {
        return data;
    }

    // Plan is not a valid response in this case
    return undefined;
};

const hasResult = (data: AnyExecuteResponse): data is DeepExecuteResponse =>
    Boolean(data && typeof data === 'object' && 'result' in data);

const isModern = (response: AnyExecuteResponse): response is ExecuteModernResponse =>
    Boolean(
        response &&
            !Array.isArray(response) &&
            Array.isArray((response as ExecuteModernResponse).result) &&
            Array.isArray((response as ExecuteModernResponse).columns),
    );

const hasCommonFields = (data: AnyResponse): data is CommonFields =>
    Boolean(
        data && typeof data === 'object' && ('ast' in data || 'plan' in data || 'stats' in data),
    );

// complex logic because of the variety of possible responses
// after all backends are updated to the latest version, it can be simplified
export const parseQueryAPIExecuteResponse = (data: AnyExecuteResponse): IQueryResult => {
    if (!data) {
        return {};
    }

    if (hasResult(data)) {
        if (isModern(data)) {
            return parseExecuteModernResponse(data);
        }

        return {
            ...data,
            result: parseDeprecatedExecuteResponseValue(data.result),
        };
    }

    if (hasCommonFields(data)) {
        return data;
    }

    return {
        result: parseDeprecatedExecuteResponseValue(data),
    };
};

// complex logic because of the variety of possible responses
// after all backends are updated to the latest version, it can be simplified
export const parseQueryAPIExplainResponse = (data: AnyExplainResponse): IQueryResult => {
    if (!data) {
        return {};
    }

    if ('ast' in data) {
        return data;
    }

    if ('result' in data) {
        const {result, ...restData} = data;

        if ('ast' in data.result) {
            return {
                ast: result.ast,
                ...restData,
            };
        }

        return {
            plan: data.result,
            ...restData,
        };
    }

    if (hasCommonFields(data)) {
        return data;
    }

    return {plan: data};
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
