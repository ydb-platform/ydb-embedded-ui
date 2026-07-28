import {
    addMinMaxIndex,
    alterSecretTemplate,
    createSecretTemplate,
    disableTTLTemplate,
    dropSecretTemplate,
    enableTTLTemplate,
    selectQueryTemplate,
    selectTopicQueryTemplate,
} from '../schemaQueryTemplates';

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
ADD INDEX \${2:my_min_max_index}
LOCAL USING min_max
ON (\${3:column_name});`);
        });
    });

    describe('secret templates', () => {
        test('creates a secret with a string value and inherited permissions', () => {
            const template = createSecretTemplate();

            expect(template).toBe(`CREATE SECRET \${1:my_secret} WITH (
    VALUE = '\${2:secret_value}',
    INHERIT_PERMISSIONS = TRUE
);`);
        });

        test('alters the selected secret value', () => {
            const template = alterSecretTemplate({
                path: '/local/my_secret',
                relativePath: 'my_secret',
            });

            expect(template).toBe(`ALTER SECRET \`my_secret\` WITH (
    VALUE = '\${1:secret_value}'
);`);
        });

        test('drops the selected secret', () => {
            const template = dropSecretTemplate({
                path: '/local/my_secret',
                relativePath: 'my_secret',
            });

            expect(template).toBe('DROP SECRET `my_secret`;');
        });
    });

    describe('selectTopicQueryTemplate', () => {
        test('selects topic data and metadata for the selected topic', () => {
            const template = selectTopicQueryTemplate({
                path: '/local/my-topic',
                relativePath: 'my-topic',
            });

            expect(template).toBe(`SELECT
    Data,
    __ydb_create_time as create_time,
    __ydb_write_time as write_time,
    __ydb_partition_id as partition_id,
    __ydb_offset as offset,
    __ydb_message_group_id as message_group_id,
    __ydb_seq_no as seq_no
FROM \`my-topic\`
-- WHERE __ydb_partition_id = 42
-- AND __ydb_write_time > CurrentUtcTimestamp() - Interval('PT60S')
-- AND __ydb_offset > 100
LIMIT \${1:10};`);
        });

        test('uses a placeholder topic path without selected topic', () => {
            const template = selectTopicQueryTemplate();

            expect(template).toContain('FROM ${1:<my_topic>}');
            expect(template).toContain('LIMIT ${2:10};');
        });
    });

    describe('selectQueryTemplate', () => {
        test('uses columns loaded for the selected system view', () => {
            expect(
                selectQueryTemplate({
                    path: '/local/.sys/view',
                    relativePath: '.sys/view',
                    schemaData: [{name: 'system_column'}],
                }),
            ).toContain('SELECT `system_column`\nFROM `.sys/view`');
        });

        test('uses the snippet placeholder when schema data is unavailable', () => {
            expect(
                selectQueryTemplate({path: '/local/.sys/view', relativePath: '.sys/view'}),
            ).toContain('SELECT ${1:*}\nFROM `.sys/view`');
        });
    });
});
