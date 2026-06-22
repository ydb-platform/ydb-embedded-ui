import type {Column, FormValues, OriginalTableInfo} from '../types';
import {PartitionsType} from '../types';
import {buildTableValidationSchema} from '../validation';

describe('TableFormDialog validation', () => {
    function createColumn(overrides: Partial<FormValues['columns'][number]> = {}) {
        return {
            _id: 'column-id',
            name: 'id',
            type: 'Int64',
            key: true,
            notNull: true,
            defaultValue: '',
            withDefaultValue: false,
            ...overrides,
        };
    }

    function createValues(overrides: Partial<FormValues> = {}): FormValues {
        return {
            name: 'dir/table',
            type: 'row',
            columns: [createColumn()],
            secondaryIndexes: [],
            deletedColumns: [],
            partitionKey: [],
            partitionCount: 64,
            settings: {
                partitionsType: PartitionsType.None,
                uniformPartitions: undefined,
                partitionsAtKeys: [],
                autoPartitionBySize: true,
                autoPartitionByLoad: false,
                autoPartitionBySizeMb: 2000,
                keyBloomFilter: false,
                ttl: {status: 'disabled'},
            },
            ...overrides,
        };
    }

    function getIssuePaths(
        result: ReturnType<ReturnType<typeof buildTableValidationSchema>['safeParse']>,
    ) {
        if (result.success) {
            return [];
        }

        return result.error.issues.map(({path}) => path.join('.'));
    }

    test('create mode requires a valid path-like name and at least one column', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                name: 'dir//table',
                columns: [],
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toEqual(expect.arrayContaining(['name', 'columns']));
    });

    test('create mode requires at least one primary key column', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                columns: [createColumn({key: false})],
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('columns');
    });

    test('create mode accepts slash-separated table names for column tables', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                name: 'dir.v1/table-name_2',
                type: 'column',
                partitionKey: ['id'],
                partitionCount: 64,
            }),
        );

        expect(result.success).toBe(true);
    });

    test('update mode accepts slash-separated names for row-table moves', () => {
        const schema = buildTableValidationSchema({mode: 'update'});

        const result = schema.safeParse(createValues({name: 'archive/orders'}));

        expect(result.success).toBe(true);
    });

    test('rejects table names with path segments longer than 255 characters', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                name: `${'a'.repeat(256)}/table`,
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('name');
    });

    test('secondary indexes cannot reference deleted columns', () => {
        const originalInfo: OriginalTableInfo = {
            name: 'orders',
            type: 'row',
            columns: [{name: 'legacy', type: 'Utf8', notNull: false}] as Column[],
            partitionKey: [],
            indexes: [],
            hasTtl: false,
            hasMinPartitions: false,
            hasMaxPartitions: false,
        };
        const schema = buildTableValidationSchema({mode: 'update', originalInfo});

        const result = schema.safeParse(
            createValues({
                name: 'orders',
                deletedColumns: [{name: 'legacy', type: 'Utf8', notNull: false}],
                secondaryIndexes: [{name: 'by_legacy', key: ['legacy']}],
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('secondaryIndexes.0.key');
    });

    test('column table creation requires partition key and partition count in range', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                type: 'column',
                partitionKey: [],
                partitionCount: 1001,
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toEqual(
            expect.arrayContaining(['partitionKey', 'partitionCount']),
        );
    });

    test('explicit partition split points must use a consistent key shape', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                columns: [
                    createColumn(),
                    createColumn({_id: 'second', name: 'tenantId', type: 'Utf8'}),
                ],
                settings: {
                    partitionsType: PartitionsType.Explicit,
                    partitionsAtKeys: [
                        [{value: '1'} as never],
                        [{value: '2'} as never, {value: 'tenant-a'} as never],
                    ],
                    ttl: {status: 'disabled'},
                },
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('settings.partitionsAtKeys');
    });

    test('ttl validation requires column, lifetime and epoch mode when needed', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                settings: {
                    partitionsType: PartitionsType.None,
                    ttl: {
                        status: 'enabled',
                        columnWithEpochMode: true,
                        lifetime: Number.NaN,
                    },
                },
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toEqual(
            expect.arrayContaining([
                'settings.ttl.column',
                'settings.ttl.epochMode',
                'settings.ttl.lifetime',
            ]),
        );
    });
});
