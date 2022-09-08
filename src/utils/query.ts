import type {ClassicResponse, KeyValueRow, ModernResponse, YdbResponse} from '../types/api/query';
import type {IQueryResult} from '../types/store/query';

export const isModern = (response: ClassicResponse | ModernResponse | YdbResponse): response is ModernResponse =>
    response &&
    !Array.isArray(response) &&
    Array.isArray(response.result) &&
    Array.isArray(response.result[0]);

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
