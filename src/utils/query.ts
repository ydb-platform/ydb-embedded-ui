import {YQLType} from '../types';
import type {ClassicResponse, KeyValueRow, ModernResponse, YdbResponse} from '../types/api/query';
import type {IQueryResult} from '../types/store/query';

export const isModern = (response: ClassicResponse | ModernResponse | YdbResponse): response is ModernResponse =>
    response &&
    !Array.isArray(response) &&
    Array.isArray(response.result) &&
    Array.isArray(response.result[0]);

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
}

export const parseResponseTypeModern = (data: ModernResponse): IQueryResult => {
    const {result, columns, ...restData} = data;

    return {
        result: result.map((row) => {
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

export const parseResponseTypeClassic = (data: ClassicResponse): IQueryResult => {
    if (Array.isArray(data)) {
        return {result: data};
    }

    return data;
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
    return error.data?.error?.message || error.data || error.statusText || JSON.stringify(error);
}
