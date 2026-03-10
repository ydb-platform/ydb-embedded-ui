import type {KeyValueRow} from '../../../../types/api/query';

const COLUMN_DIVIDER = '\t';
const ROW_DIVIDER = '\n';

/** Builds TSV data as BlobPart[] to avoid the V8 max string length limit. */
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
