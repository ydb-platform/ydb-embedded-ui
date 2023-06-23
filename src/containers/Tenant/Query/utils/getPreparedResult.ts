import type {KeyValueRow} from '../../../../types/api/query';
import type {IQueryResult} from '../../../../types/store/query';

export const getPreparedResult = (data: IQueryResult) => {
    const columnDivider = '\t';
    const rowDivider = '\n';

    if (!data?.result?.length) {
        return '';
    }

    const columnHeaders = Object.keys(data.result[0]);
    const rows = Array<string[] | KeyValueRow[]>(columnHeaders).concat(data.result);

    return rows
        .map((item) => {
            const row = [];

            for (const field in item) {
                if (typeof item[field] === 'object' || Array.isArray(item[field])) {
                    row.push(JSON.stringify(item[field]));
                } else {
                    row.push(item[field]);
                }
            }

            return row.join(columnDivider);
        })
        .join(rowDivider);
};
