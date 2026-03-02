import {EMPTY_DATA_PLACEHOLDER} from './constants';
export const MAX_COLUMN_WIDTH = 600;
export const HEADER_PADDING = 20;
export const SORT_ICON_TO_CHARACTERS = 2;
export const PIXELS_PER_CHARACTER = 10;

export function getColumnWidth({
    data,
    name,
    header,
    sortable,
}: {
    data?: Record<string, unknown>[];
    name: string;
    header?: string;
    sortable?: boolean;
}) {
    const headerContentLength = typeof header === 'string' ? header.length : name.length;

    let maxColumnContentLength = sortable
        ? headerContentLength + SORT_ICON_TO_CHARACTERS
        : headerContentLength;

    if (data) {
        for (const row of data) {
            const raw = row[name];

            const cellText =
                raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '')
                    ? EMPTY_DATA_PLACEHOLDER
                    : String(raw);

            const cellLength = cellText.length;

            maxColumnContentLength = Math.max(maxColumnContentLength, cellLength);

            if (
                maxColumnContentLength * PIXELS_PER_CHARACTER + HEADER_PADDING >=
                MAX_COLUMN_WIDTH
            ) {
                return MAX_COLUMN_WIDTH;
            }
        }
    }

    return maxColumnContentLength * PIXELS_PER_CHARACTER + HEADER_PADDING;
}
