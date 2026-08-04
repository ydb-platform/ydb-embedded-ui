import {prepareQueryWithPragmas, prepareQueryWithPragmasMetadata} from '../utils';

describe('prepareQueryWithPragmas', () => {
    test('Should prepend pragmas correctly', () => {
        // This tests the behavior through the actual query API
        const pragma = 'PRAGMA OrderedColumns;';
        const query = 'SELECT * FROM table;';
        const expectedResult = prepareQueryWithPragmas(query, pragma);

        // The actual test would be integration test with the query API
        expect(expectedResult).toBe('PRAGMA OrderedColumns;\n\nSELECT * FROM table;');
    });

    test('Should handle empty pragmas', () => {
        const query = 'SELECT * FROM table;';
        const pragma = '';
        const expectedResult = prepareQueryWithPragmas(query, pragma);

        // When pragma is empty, query should remain unchanged
        expect(expectedResult).toBe('SELECT * FROM table;');
    });

    test('Should handle pragmas without semicolon', () => {
        const pragma = 'PRAGMA OrderedColumns';
        const query = 'SELECT * FROM table;';
        const expectedResult = prepareQueryWithPragmas(query, pragma);

        expect(expectedResult).toBe('PRAGMA OrderedColumns;\n\nSELECT * FROM table;');
    });

    test.each([
        {
            name: 'no pragma',
            pragmas: undefined,
            expectedQuery: 'SELECT 1;',
            expectedPrefixLineCount: 0,
        },
        {
            name: 'single-line pragma',
            pragmas: 'PRAGMA OrderedColumns;',
            expectedQuery: 'PRAGMA OrderedColumns;\n\nSELECT 1;',
            expectedPrefixLineCount: 2,
        },
        {
            name: 'multi-line pragma',
            pragmas: 'PRAGMA OrderedColumns;\nPRAGMA AnsiOptionalAS;',
            expectedQuery: 'PRAGMA OrderedColumns;\nPRAGMA AnsiOptionalAS;\n\nSELECT 1;',
            expectedPrefixLineCount: 3,
        },
    ])(
        'returns prepared-query metadata for $name',
        ({pragmas, expectedQuery, expectedPrefixLineCount}) => {
            expect(prepareQueryWithPragmasMetadata('SELECT 1;', pragmas)).toEqual({
                query: expectedQuery,
                preparedQueryPrefixLineCount: expectedPrefixLineCount,
            });
        },
    );
});
