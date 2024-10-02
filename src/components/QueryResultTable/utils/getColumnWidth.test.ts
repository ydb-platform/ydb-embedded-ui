import {
    MAX_COLUMN_WIDTH,
    PADDING_NO_SORT_ICON,
    PADDING_WITH_SORT_ICON,
    getColumnWidth,
} from './getColumnWidth';

describe('getColumnWidth', () => {
    it('returns minimum width for empty data', () => {
        const result = getColumnWidth({data: [], name: 'test', columnType: 'string'});
        expect(result).toBe(PADDING_NO_SORT_ICON + 'test'.length * 10);
    });

    it('calculates correct width for string columns', () => {
        const data = [{test: 'short'}, {test: 'medium length'}, {test: 'this is a longer string'}];
        const result = getColumnWidth({data, name: 'test', columnType: 'string'});
        expect(result).toBe(PADDING_NO_SORT_ICON + 'this is a longer string'.length * 10);
    });

    it('calculates correct width for number columns', () => {
        const data = [{test: 123}, {test: 456789}, {test: 0}];
        const result = getColumnWidth({data, name: 'test', columnType: 'number'});
        expect(result).toBe(PADDING_WITH_SORT_ICON + '456789'.length * 10);
    });

    it('returns MAX_COLUMN_WIDTH when calculated width exceeds it', () => {
        const data = [{test: 'a'.repeat(100)}];
        const result = getColumnWidth({data, name: 'test', columnType: 'string'});
        expect(result).toBe(MAX_COLUMN_WIDTH);
    });

    it('handles undefined data correctly', () => {
        const result = getColumnWidth({name: 'test', columnType: 'string'});
        expect(result).toBe(PADDING_NO_SORT_ICON + 'test'.length * 10);
    });

    it('handles missing values in data correctly', () => {
        const data = [{test: 'short'}, {}, {test: 'longer string'}];
        const result = getColumnWidth({data, name: 'test', columnType: 'string'});
        expect(result).toBe(PADDING_NO_SORT_ICON + 'longer string'.length * 10);
    });

    it('uses column name length when all values are shorter', () => {
        const data = [{longColumnName: 'a'}, {longColumnName: 'bb'}];
        const result = getColumnWidth({data, name: 'longColumnName', columnType: 'string'});
        expect(result).toBe(PADDING_NO_SORT_ICON + 'longColumnName'.length * 10);
    });
});
