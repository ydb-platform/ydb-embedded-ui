import {enableTTLTemplate, manageTTLTemplate} from '../schemaQueryTemplates';

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

    describe('manageTTLTemplate', () => {
        test('resets TTL for the selected table', () => {
            const template = manageTTLTemplate({path: '/local/table', relativePath: 'table'});

            expect(template).toContain('https://ydb.tech/docs/en/yql/reference/recipes/ttl');
            expect(template).toContain('ALTER TABLE `table` RESET (TTL);');
        });
    });
});
