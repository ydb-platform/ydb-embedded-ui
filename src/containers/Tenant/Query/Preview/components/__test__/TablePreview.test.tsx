import {prepareQueryWithPragmas} from '../../../../../../store/reducers/query/utils';

describe('TablePreview Pragmas Integration', () => {
    test('prepareQueryWithPragmas should work with table preview queries', () => {
        const tablePreviewQuery = 'select * from `test-table` limit 101';
        const pragmas = 'PRAGMA OrderedColumns;';

        const result = prepareQueryWithPragmas(tablePreviewQuery, pragmas);

        expect(result).toBe('PRAGMA OrderedColumns;\n\nselect * from `test-table` limit 101');
    });

    test('prepareQueryWithPragmas should handle empty pragmas for table preview', () => {
        const tablePreviewQuery = 'select * from `test-table` limit 101';
        const pragmas = '';

        const result = prepareQueryWithPragmas(tablePreviewQuery, pragmas);

        expect(result).toBe('select * from `test-table` limit 101');
    });

    test('prepareQueryWithPragmas should handle undefined pragmas for table preview', () => {
        const tablePreviewQuery = 'select * from `test-table` limit 101';
        const pragmas = undefined;

        const result = prepareQueryWithPragmas(tablePreviewQuery, pragmas);

        expect(result).toBe('select * from `test-table` limit 101');
    });

    test('prepareQueryWithPragmas should handle multiple pragmas for table preview', () => {
        const tablePreviewQuery = 'select * from `test-table` limit 101';
        const pragmas = 'PRAGMA OrderedColumns;\nPRAGMA AnsiInForEmptyOrNullableItemsCollections;';

        const result = prepareQueryWithPragmas(tablePreviewQuery, pragmas);

        expect(result).toBe(
            'PRAGMA OrderedColumns;\nPRAGMA AnsiInForEmptyOrNullableItemsCollections;\n\nselect * from `test-table` limit 101',
        );
    });
});
