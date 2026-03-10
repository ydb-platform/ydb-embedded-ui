import {buildTsvBlobParts} from '../getPreparedResult';

describe('buildTsvBlobParts', () => {
    it('returns empty array for undefined', () => {
        expect(buildTsvBlobParts(undefined)).toEqual([]);
    });

    it('returns empty array for empty array', () => {
        expect(buildTsvBlobParts([])).toEqual([]);
    });

    it('produces correct TSV for a single row', () => {
        const data = [{name: 'Alice', age: '30'}];
        const parts = buildTsvBlobParts(data);
        const result = parts.join('');
        expect(result).toBe('name\tage\nAlice\t30');
    });

    it('produces correct TSV for multiple rows', () => {
        const data = [
            {id: '1', value: 'a'},
            {id: '2', value: 'b'},
        ];
        const parts = buildTsvBlobParts(data);
        const result = parts.join('');
        expect(result).toBe('id\tvalue\n1\ta\n2\tb');
    });

    it('escapes tabs, newlines, and backslashes in values', () => {
        const data = [{col: 'line1\nline2\ttab\\slash'}];
        const parts = buildTsvBlobParts(data);
        const result = parts.join('');
        expect(result).toBe('col\nline1\\nline2\\ttab\\\\slash');
    });

    it('JSON-stringifies object values', () => {
        const data = [{col: {nested: true} as unknown as string}];
        const parts = buildTsvBlobParts(data);
        const result = parts.join('');
        expect(result).toBe('col\n{"nested":true}');
    });

    it('each row is a separate BlobPart (no single giant string)', () => {
        const data = [{a: '1'}, {a: '2'}, {a: '3'}];
        const parts = buildTsvBlobParts(data);
        // header + (newline + row) * 3 = 7 parts
        expect(parts.length).toBe(7);
    });
});
