import type {KeyValueRow} from '../../../../types/api/query';

const COLUMN_DIVIDER = '\t';
const ROW_DIVIDER = '\n';

export function getPreparedResult(data: KeyValueRow[] | undefined) {
    if (!data?.length) {
        return '';
    }

    const columnHeaders = Object.keys(data[0]);
    const rows = [columnHeaders.map(escapeValue).join(COLUMN_DIVIDER)];
    for (const row of data) {
        const value = [];
        for (const column of columnHeaders) {
            const v = row[column];
            value.push(escapeValue(typeof v === 'object' ? JSON.stringify(v) : `${v}`));
        }
        rows.push(value.join(COLUMN_DIVIDER));
    }
    return rows.join(ROW_DIVIDER);
}

/**
 * Builds an array of BlobPart entries representing TSV data.
 * Unlike getPreparedResult, this never creates a single giant string,
 * so it avoids the V8 max string length limit (~268 MB).
 */
export function buildTsvBlobParts(data: KeyValueRow[] | undefined): BlobPart[] {
    if (!data?.length) {
        return [];
    }

    const columnHeaders = Object.keys(data[0]);
    const parts: BlobPart[] = [columnHeaders.map(escapeValue).join(COLUMN_DIVIDER)];

    for (const row of data) {
        parts.push(ROW_DIVIDER);
        const values = [];
        for (const column of columnHeaders) {
            const v = row[column];
            values.push(escapeValue(typeof v === 'object' ? JSON.stringify(v) : `${v}`));
        }
        parts.push(values.join(COLUMN_DIVIDER));
    }

    return parts;
}

function escapeValue(value: string) {
    return value
        .replaceAll('\\', '\\\\')
        .replaceAll('\n', '\\n')
        .replaceAll('\r', '\\r')
        .replaceAll('\t', '\\t');
}
