import {prepareQueryWithPragmas} from '../../../../../store/reducers/query/utils';

describe('TablePreview - Pragma Integration', () => {
    test('should correctly prepare query with pragmas for table preview', () => {
        const baseQuery = 'select * from `test-table` limit 101';
        const pragmas = 'PRAGMA OrderedColumns;';

        const result = prepareQueryWithPragmas(baseQuery, pragmas);

        expect(result).toBe('PRAGMA OrderedColumns;\n\nselect * from `test-table` limit 101');
    });

    test('should handle empty pragmas correctly in table preview', () => {
        const baseQuery = 'select * from `test-table` limit 101';
        const pragmas = '';

        const result = prepareQueryWithPragmas(baseQuery, pragmas);

        expect(result).toBe('select * from `test-table` limit 101');
    });

    test('should handle multiple pragmas correctly in table preview', () => {
        const baseQuery = 'select * from `test-table` limit 101';
        const pragmas = 'PRAGMA OrderedColumns;\nPRAGMA AnsiOptionalAS;';

        const result = prepareQueryWithPragmas(baseQuery, pragmas);

        expect(result).toBe(
            'PRAGMA OrderedColumns;\nPRAGMA AnsiOptionalAS;\n\nselect * from `test-table` limit 101',
        );
    });

    test('should handle pragmas without semicolon correctly in table preview', () => {
        const baseQuery = 'select * from `test-table` limit 101';
        const pragmas = 'PRAGMA OrderedColumns';

        const result = prepareQueryWithPragmas(baseQuery, pragmas);

        expect(result).toBe('PRAGMA OrderedColumns;\n\nselect * from `test-table` limit 101');
    });
});
