import type {SchemaData} from '../containers/Tenant/Schema/SchemaViewer/types';
import type {KeyValueRow} from '../types/api/query';

const MAX_COLUMN_WIDTH = 600;
const HEADER_PADDING = 20;
const SORT_ICON_PADDING = 18;
const PIXELS_PER_CHARACTER = 10;

export function getColumnWidth<T extends KeyValueRow | SchemaData>({
    data,
    name,
    header,
    sortable,
}: {
    data?: T[];
    name: string;
    header?: string;
    sortable?: boolean;
}) {
    const sortPadding = sortable ? SORT_ICON_PADDING : 0;
    let maxColumnContentLength = typeof header === 'string' ? header.length : name.length;

    if (data) {
        for (const row of data) {
            let cellLength = 0;
            if (hasProperty(row, name) && row[name]) {
                cellLength = String(row[name]).length;
            }

            maxColumnContentLength = Math.max(maxColumnContentLength, cellLength);

            if (
                maxColumnContentLength * PIXELS_PER_CHARACTER + HEADER_PADDING >=
                MAX_COLUMN_WIDTH
            ) {
                return MAX_COLUMN_WIDTH;
            }
        }
    }

    return maxColumnContentLength * PIXELS_PER_CHARACTER + HEADER_PADDING + sortPadding;
}

function hasProperty(obj: KeyValueRow | SchemaData, key: string): obj is KeyValueRow {
    return key in obj;
}
