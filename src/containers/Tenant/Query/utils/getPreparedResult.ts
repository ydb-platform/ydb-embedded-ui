import type {KeyValueRow} from '../../../../types/api/query';

export const getPreparedResult = (data: KeyValueRow[] | undefined) => {
    const columnDivider = '\t';
    const rowDivider = '\n';

    if (!data?.length) {
        return '';
    }

    const columnHeaders = Object.keys(data[0]);
    const rows = Array<string[] | KeyValueRow[]>(columnHeaders).concat(data);

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
