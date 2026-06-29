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

    test('rejects duplicate column names in create mode before submit', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                columns: [createColumn(), createColumn({_id: 'second', key: false})],
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toEqual(
            expect.arrayContaining(['columns.0.name', 'columns.1.name']),
        );
    });

    test.each([
        ['Bool', 'maybe'],
        ['Int64', 'abc'],
        ['Int64', ''],
        ['Date', '2025-13-40'],
        ['Json', ''],
    ])('rejects invalid default value %s=%s before submit', (type, defaultValue) => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                columns: [
                    createColumn({
                        type,
                        key: false,
                        withDefaultValue: true,
                        defaultValue,
                    }),
                ],
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('columns.0.defaultValue');
    });

    test.each([
        ['Int64', '42'],
        ['Bool', 'true'],
        ['Date', '2025-01-02'],
        ['Utf8', ''],
        ['Utf8', '$value'],
        ['Json', '{"ok":true}'],
    ])('accepts valid default value %s=%s', (type, defaultValue) => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                columns: [
                    createColumn(),
                    createColumn({
                        _id: 'with-default',
                        name: 'value_with_default',
                        type,
                        key: false,
                        withDefaultValue: true,
                        defaultValue,
                    }),
                ],
            }),
        );

        expect(result.success).toBe(true);
    });

    test('create mode ignores hidden default values for key autoincrement columns', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                columns: [
                    createColumn({
                        withDefaultValue: true,
                        autoincrement: true,
                        defaultValue: 'not-a-number',
                    }),
                ],
            }),
        );

        expect(result.success).toBe(true);
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

    test('rejects duplicate secondary index names before submit', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                columns: [
                    createColumn(),
                    createColumn({_id: 'second', name: 'status', key: false, type: 'Utf8'}),
                ],
                secondaryIndexes: [
                    {name: 'by_status', key: ['status']},
                    {name: 'by_status', key: ['id']},
                ],
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toEqual(
            expect.arrayContaining(['secondaryIndexes.0.name', 'secondaryIndexes.1.name']),
        );
    });

    test('existing secondary index columns cannot be deleted', () => {
        const originalInfo: OriginalTableInfo = {
            name: 'orders',
            type: 'row',
            columns: [{name: 'status', type: 'Utf8', notNull: false}] as Column[],
            partitionKey: [],
            indexes: [{name: 'by_status', columns: ['status']}],
            hasTtl: false,
            hasMinPartitions: false,
            hasMaxPartitions: false,
        };
        const schema = buildTableValidationSchema({mode: 'update', originalInfo});

        const result = schema.safeParse(
            createValues({
                name: 'orders',
                deletedColumns: [{name: 'status', type: 'Utf8', notNull: false}],
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('columns');
    });

    test('rejects new columns that duplicate existing non-deleted columns in update mode', () => {
        const originalInfo: OriginalTableInfo = {
            name: 'orders',
            type: 'row',
            columns: [{name: 'status', type: 'Utf8', notNull: false}] as Column[],
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
                columns: [createColumn({name: 'status', key: false})],
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('columns.0.name');
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

    test('ttl validation requires column and lifetime when ttl is enabled', () => {
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
            expect.arrayContaining(['settings.ttl.column', 'settings.ttl.lifetime']),
        );
    });

    test('ttl validation requires epoch mode for numeric ttl columns', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                columns: [
                    createColumn(),
                    createColumn({
                        _id: 'ttl-column',
                        name: 'expireAt',
                        type: 'Uint64',
                        key: false,
                    }),
                ],
                settings: {
                    partitionsType: PartitionsType.None,
                    ttl: {
                        status: 'enabled',
                        column: 'expireAt',
                        columnWithEpochMode: true,
                        lifetime: 1,
                    },
                },
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('settings.ttl.epochMode');
    });

    test('ttl validation rejects stale selected columns after type changes', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                columns: [
                    createColumn(),
                    createColumn({
                        _id: 'ttl-column',
                        name: 'expiresAt',
                        type: 'Utf8',
                        key: false,
                    }),
                ],
                settings: {
                    partitionsType: PartitionsType.None,
                    ttl: {
                        status: 'enabled',
                        column: 'expiresAt',
                        columnWithEpochMode: true,
                        lifetime: 1,
                    },
                },
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toContain('settings.ttl.column');
        expect(getIssuePaths(result)).not.toContain('settings.ttl.epochMode');
    });

    test('rejects inverted auto-partition min and max values before submit', () => {
        const schema = buildTableValidationSchema({mode: 'create'});

        const result = schema.safeParse(
            createValues({
                settings: {
                    partitionsType: PartitionsType.None,
                    autoPartitionBySize: true,
                    autoPartitionByLoad: false,
                    autoPartitionMinPartitions: 100,
                    autoPartitionMaxPartitions: 10,
                    ttl: {status: 'disabled'},
                },
            }),
        );

        expect(result.success).toBe(false);
        expect(getIssuePaths(result)).toEqual(
            expect.arrayContaining([
                'settings.autoPartitionMinPartitions',
                'settings.autoPartitionMaxPartitions',
            ]),
        );

        if (result.success) {
            return;
        }

        expect(result.error.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: ['settings', 'autoPartitionMinPartitions'],
                    message: 'Minimum must not be greater than maximum',
                }),
                expect.objectContaining({
                    path: ['settings', 'autoPartitionMaxPartitions'],
                    message: 'Maximum must not be less than minimum',
                }),
            ]),
        );
    });
});
