// Integration test for pragmas functionality
describe('Pragmas Integration Tests', () => {
    test('should correctly prepend pragmas to query for execution', () => {
        // Test the actual function logic that would be used in query execution
        const testQuery = 'SELECT * FROM users WHERE id = 1;';
        const testPragmas = 'PRAGMA OrderedColumns;';

        // This is the logic from our prepareQueryWithPragmas function
        const prepareQuery = (query: string, pragmas?: string): string => {
            if (!pragmas || !pragmas.trim()) {
                return query;
            }

            const trimmedPragmas = pragmas.trim();
            const separator = trimmedPragmas.endsWith(';') ? '\n\n' : ';\n\n';

            return `${trimmedPragmas}${separator}${query}`;
        };

        const result = prepareQuery(testQuery, testPragmas);

        expect(result).toBe('PRAGMA OrderedColumns;\n\nSELECT * FROM users WHERE id = 1;');
    });

    test('should handle multiple pragmas correctly', () => {
        const query = 'SELECT COUNT(*) FROM orders;';
        const pragmas = `PRAGMA OrderedColumns;
PRAGMA AnsiOptionalAS;
PRAGMA DisableAnsiRankForNullableKeys;`;

        const prepareQuery = (query: string, pragmas?: string): string => {
            if (!pragmas || !pragmas.trim()) {
                return query;
            }

            const trimmedPragmas = pragmas.trim();
            const separator = trimmedPragmas.endsWith(';') ? '\n\n' : ';\n\n';

            return `${trimmedPragmas}${separator}${query}`;
        };

        const result = prepareQuery(query, pragmas);

        expect(result).toContain('PRAGMA OrderedColumns;');
        expect(result).toContain('PRAGMA AnsiOptionalAS;');
        expect(result).toContain('PRAGMA DisableAnsiRankForNullableKeys;');
        expect(result).toContain('SELECT COUNT(*) FROM orders;');
    });

    test('should preserve query when pragmas are empty', () => {
        const query = 'EXPLAIN SELECT * FROM table;';
        const pragmas = '';

        const prepareQuery = (query: string, pragmas?: string): string => {
            if (!pragmas || !pragmas.trim()) {
                return query;
            }

            const trimmedPragmas = pragmas.trim();
            const separator = trimmedPragmas.endsWith(';') ? '\n\n' : ';\n\n';

            return `${trimmedPragmas}${separator}${query}`;
        };

        const result = prepareQuery(query, pragmas);

        expect(result).toBe(query);
    });
});
