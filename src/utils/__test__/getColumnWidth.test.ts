import {
    HEADER_PADDING,
    MAX_COLUMN_WIDTH,
    PIXELS_PER_CHARACTER,
    SORT_ICON_PADDING,
    getColumnWidth,
} from '../getColumnWidth';

describe('getColumnWidth', () => {
    it('returns minimum width for empty data', () => {
        const result = getColumnWidth({data: [], name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'test'.length * PIXELS_PER_CHARACTER);
    });

    it('calculates correct width for string columns', () => {
        const data = [{test: 'short'}, {test: 'medium length'}, {test: 'this is a longer string'}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(
            HEADER_PADDING + 'this is a longer string'.length * PIXELS_PER_CHARACTER,
        );
    });

    it('calculates correct width for columns with sorting', () => {
        const result = getColumnWidth({data: [], name: 'test', sortable: true});
        expect(result).toBe(
            HEADER_PADDING + SORT_ICON_PADDING + 'test'.length * PIXELS_PER_CHARACTER,
        );
    });

    it('calculates correct width for columns with header', () => {
        const result = getColumnWidth({data: [], name: 'test', header: 'a'});
        expect(result).toBe(HEADER_PADDING + 'a'.length * PIXELS_PER_CHARACTER);
    });

    it('returns MAX_COLUMN_WIDTH when calculated width exceeds it', () => {
        const data = [{test: 'a'.repeat(100)}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(MAX_COLUMN_WIDTH);
    });

    it('handles undefined data correctly', () => {
        const result = getColumnWidth({name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'test'.length * PIXELS_PER_CHARACTER);
    });

    it('handles missing values in data correctly', () => {
        const data = [{test: 'short'}, {}, {test: 'longer string'}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'longer string'.length * PIXELS_PER_CHARACTER);
    });

    it('uses column name length when all values are shorter', () => {
        const data = [{longColumnName: 'a'}, {longColumnName: 'bb'}];
        const result = getColumnWidth({data, name: 'longColumnName'});
        expect(result).toBe(HEADER_PADDING + 'longColumnName'.length * PIXELS_PER_CHARACTER);
    });

    it('handles null values in data correctly', () => {
        const data = [{test: 'a'}, {test: null}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'test'.length * PIXELS_PER_CHARACTER);
    });

    it('handles undefined values in data correctly', () => {
        const data = [{test: 'a'}, {test: undefined}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'test'.length * PIXELS_PER_CHARACTER);
    });

    it('handles empty string values in data correctly', () => {
        const data = [{test: 'short'}, {test: ''}, {test: 'longer string'}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'longer string'.length * PIXELS_PER_CHARACTER);
    });

    it('handles an array of numbers correctly', () => {
        const data = [{test: 1}, {test: 123}, {test: 12345}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(HEADER_PADDING + '12345'.length * PIXELS_PER_CHARACTER);
    });

    it('handles an array of mixed data types correctly', () => {
        const data = [{test: 'short'}, {test: 123}, {test: null}, {test: 'longer string'}];
        const result = getColumnWidth({data, name: 'test'});
        expect(result).toBe(HEADER_PADDING + 'longer string'.length * PIXELS_PER_CHARACTER);
    });

    it('handles empty name correctly', () => {
        const data = [{test: 'test'}];
        const result = getColumnWidth({data, name: ''});
        expect(result).toBe(HEADER_PADDING);
    });
});
