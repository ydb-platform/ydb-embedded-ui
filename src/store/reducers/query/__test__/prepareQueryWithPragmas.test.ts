import {prepareQueryWithPragmas} from '../utils';

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
});
