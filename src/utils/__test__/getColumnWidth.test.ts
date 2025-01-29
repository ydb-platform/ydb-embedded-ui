import {HEADER_PADDING, MAX_COLUMN_WIDTH, getColumnWidth} from '../getColumnWidth';

describe('getColumnWidth', () => {
    it('returns minimum width for empty data', () => {
        const result = getColumnWidth({data: [], name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'test'.length * 10);
    });

    it('calculates correct width for string columns', () => {
        const data = [{test: 'short'}, {test: 'medium length'}, {test: 'this is a longer string'}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'this is a longer string'.length * 10);
    });

    it('returns MAX_COLUMN_WIDTH when calculated width exceeds it', () => {
        const data = [{test: 'a'.repeat(100)}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(MAX_COLUMN_WIDTH);
    });

    it('handles undefined data correctly', () => {
        const result = getColumnWidth({name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'test'.length * 10);
    });

    it('handles missing values in data correctly', () => {
        const data = [{test: 'short'}, {}, {test: 'longer string'}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'longer string'.length * 10);
    });

    it('uses column name length when all values are shorter', () => {
        const data = [{longColumnName: 'a'}, {longColumnName: 'bb'}];
        const result = getColumnWidth({data, name: 'longColumnName'});
        expect(result).toBe(HEADER_PADDING + 'longColumnName'.length * 10);
    });
});
