import type {KeyValueRow} from '../../../types/api/query';

export const MAX_COLUMN_WIDTH = 600;
export const HEADER_PADDING = 20;

export const getColumnWidth = ({data, name}: {data?: KeyValueRow[]; name: string}) => {
    let maxColumnContentLength = name.length;

    if (data) {
        for (const row of data) {
            const cellLength = row[name] ? String(row[name]).length : 0;
            maxColumnContentLength = Math.max(maxColumnContentLength, cellLength);

            if (maxColumnContentLength * 10 + HEADER_PADDING >= MAX_COLUMN_WIDTH) {
                return MAX_COLUMN_WIDTH;
            }
        }
    }

    return maxColumnContentLength * 10 + HEADER_PADDING;
};
