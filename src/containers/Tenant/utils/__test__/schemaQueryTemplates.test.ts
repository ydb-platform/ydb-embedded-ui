import {
    addMinMaxIndex,
    disableTTLTemplate,
    enableTTLTemplate,
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

    describe('selectTopicQueryTemplate', () => {
        test('selects topic data and metadata for the selected topic', () => {
            const template = selectTopicQueryTemplate({
                path: '/local/my-topic',
                relativePath: 'my-topic',
            });

            expect(template).toBe(`SELECT
    Data,
    SystemMetadata('create_time') as create_time,
    SystemMetadata('write_time') as write_time,
    SystemMetadata('partition_id') as partition_id,
    SystemMetadata('offset') as offset,
    SystemMetadata('message_group_id') as message_group_id,
    SystemMetadata('seq_no') as seq_no
FROM \`my-topic\`
-- WHERE SystemMetadata('partition_id') = 42
-- AND SystemMetadata('write_time') > CurrentUtcTimestamp() - Interval('PT60S')
-- AND SystemMetadata('offset') > 100
LIMIT \${1:10};`);
        });

        test('uses a placeholder topic path without selected topic', () => {
            const template = selectTopicQueryTemplate();

            expect(template).toContain('FROM ${1:<my_topic>}');
            expect(template).toContain('LIMIT ${2:10};');
        });
    });
});
