import type {KeyValueRow} from '../../../../types/api/query';

export function getPreparedResult(data: KeyValueRow[] | undefined) {
    const columnDivider = '\t';
    const rowDivider = '\n';

    if (!data?.length) {
        return '';
    }

    const columnHeaders = Object.keys(data[0]);
    const rows = [columnHeaders.map(escapeValue).join(columnDivider)];
    for (const row of data) {
        const value = [];
        for (const column of columnHeaders) {
            const v = row[column];
            value.push(escapeValue(typeof v === 'object' ? JSON.stringify(v) : `${v}`));
        }
        rows.push(value.join(columnDivider));
    }
    return rows.join(rowDivider);
}

function escapeValue(value: string) {
    return value
        .replaceAll('\\', '\\\\')
        .replaceAll('\n', '\\n')
        .replaceAll('\r', '\\r')
        .replaceAll('\t', '\\t');
}

export function getStringifiedQueryStats(data: unknown) {
    if (!data) {
        return undefined;
    }
    if (typeof data === 'string') {
        return data;
    }
    return JSON.stringify(data, null, 2);
}
