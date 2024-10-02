import type {KeyValueRow} from '../../../types/api/query';

export const MAX_COLUMN_WIDTH = 600;
export const PADDING_WITH_SORT_ICON = 55;
export const PADDING_NO_SORT_ICON = 35;

export const getColumnWidth = ({
    data,
    name,
    columnType,
}: {
    data?: KeyValueRow[];
    name: string;
    columnType?: string;
}) => {
    let maxColumnContentLength = name.length;
    const headerPadding = columnType === 'number' ? PADDING_WITH_SORT_ICON : PADDING_NO_SORT_ICON;

    if (data) {
        for (const row of data) {
            const cellLength = row[name] ? String(row[name]).length : 0;
            maxColumnContentLength = Math.max(maxColumnContentLength, cellLength);

            if (maxColumnContentLength * 10 + headerPadding >= MAX_COLUMN_WIDTH) {
                return MAX_COLUMN_WIDTH;
            }
        }
    }

    return Math.min(maxColumnContentLength * 10 + headerPadding, MAX_COLUMN_WIDTH);
};
