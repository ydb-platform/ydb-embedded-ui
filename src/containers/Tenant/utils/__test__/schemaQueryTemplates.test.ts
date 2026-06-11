import {addMinMaxIndex, disableTTLTemplate, enableTTLTemplate} from '../schemaQueryTemplates';

describe('schemaQueryTemplates', () => {
    describe('enableTTLTemplate', () => {
        test('does not suggest disabling TTL with a zero interval', () => {
            const template = enableTTLTemplate({path: '/local/table', relativePath: 'table'});

            expect(template).toContain('ALTER TABLE `table` SET');
            expect(template).toContain('TTL = Interval("PT24H")');
            expect(template).not.toContain('To disable TTL');
            expect(template).not.toContain('PT0S');
        });
    });

    describe('disableTTLTemplate', () => {
        test('resets TTL for the selected table', () => {
            const template = disableTTLTemplate({path: '/local/table', relativePath: 'table'});

            expect(template).toContain('https://ydb.tech/docs/en/yql/reference/recipes/ttl');
            expect(template).toContain('ALTER TABLE `table` RESET (TTL);');
        });
    });

    describe('addMinMaxIndex', () => {
        test('uses placeholder table path without selected table', () => {
            const template = addMinMaxIndex();

            expect(template).toContain('ALTER TABLE ${1:<my_column_table>}');
        });

        test('adds local min_max index for the selected column table', () => {
            const template = addMinMaxIndex({
                path: '/local/my_column_table',
                relativePath: 'my_column_table',
            });

            expect(template).toBe(`ALTER TABLE \`my_column_table\`
ADD INDEX \${2:my_column_table_min_max_index_column_name}
LOCAL USING min_max
ON (\${3:column_name});`);
        });
    });
});
