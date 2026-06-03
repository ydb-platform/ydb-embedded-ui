import {EPathType} from '../../../../types/api/schema/schema';
import {EColumnCodec, EUnit} from '../../../../types/api/schema/shared';
import {PartitionsType} from '../types';
import {
    buildCreateColumnTableQuery,
    buildCreateTableQuery,
    buildUpdateTableQuery,
    getTablePathInfoForUpdate,
    getUpdateTableSettings,
    prepareColumnValue,
    prepareFormValues,
} from '../utils';

describe('table utils', () => {
    test('prepareColumnValue handles nulls, params, escaped strings, dates and uuid values', () => {
        expect(prepareColumnValue({type: 'Utf8'} as never, null)).toBe('null');
        expect(prepareColumnValue({type: 'Int64'} as never, '$value')).toBe('$value');
        expect(prepareColumnValue({type: 'Utf8'} as never, 'line\n"quoted"')).toBe(
            '"line\\u000a\\"quoted\\""',
        );
        expect(
            prepareColumnValue({type: 'Timestamp'} as never, '2025-01-01T00:00:00.000001Z'),
        ).toBe('Timestamp("2025-01-01T00:00:00.000001Z")');
        expect(
            prepareColumnValue({type: 'Uuid'} as never, '550e8400-e29b-41d4-a716-446655440000'),
        ).toBe('CAST("550e8400-e29b-41d4-a716-446655440000" AS Uuid)');
    });

    test('buildCreateTableQuery includes indexes, TTL and table settings', () => {
        const query = buildCreateTableQuery({
            tableName: 'folder/orders',
            columns: [
                {
                    name: 'id',
                    type: 'Int64',
                    key: true,
                    notNull: true,
                    autoincrement: true,
                },
                {
                    name: 'createdAt',
                    type: 'Timestamp',
                    notNull: true,
                },
                {
                    name: 'payload',
                    type: 'Json',
                    notNull: false,
                    defaultValue: '{"hello":"world"}',
                },
            ],
            secondaryIndexes: [{name: 'by_payload', key: ['payload']}],
            settings: {
                autoPartitionBySize: true,
                autoPartitionBySizeMb: 2048,
                keyBloomFilter: true,
                ttl: {
                    status: 'enabled',
                    column: 'createdAt',
                    lifetime: 25,
                    unit: 'hours',
                },
            },
        });

        expect(query).toContain('CREATE TABLE `folder/orders`');
        expect(query).toContain('`id` BigSerial NOT NULL');
        expect(query).toContain('DEFAULT "{\\"hello\\":\\"world\\"}"');
        expect(query).toContain('INDEX `by_payload` GLOBAL ON (`payload`)');
        expect(query).toContain('PRIMARY KEY (`id`)');
        expect(query).toContain('AUTO_PARTITIONING_PARTITION_SIZE_MB = 2048');
        expect(query).toContain('KEY_BLOOM_FILTER = ENABLED');
        expect(query).toContain('TTL = Interval("P1DT1H") ON `createdAt`');
    });

    test('buildCreateColumnTableQuery includes hash partitioning and TTL epoch mode', () => {
        const query = buildCreateColumnTableQuery({
            tableName: 'events',
            columns: [
                {
                    name: 'tenantId',
                    type: 'Uint64',
                    key: true,
                    notNull: true,
                },
            ],
            columnsHash: ['tenantId'],
            settings: {
                autoPartitionMinPartitions: 32,
                ttl: {
                    status: 'enabled',
                    column: 'createdAt',
                    lifetime: 3600,
                    epochMode: 'milliseconds',
                },
            },
        });

        expect(query).toContain('CREATE TABLE events');
        expect(query).toContain('PARTITION BY HASH(`tenantId`)');
        expect(query).toContain('STORE = COLUMN');
        expect(query).toContain('AUTO_PARTITIONING_MIN_PARTITIONS_COUNT = 32');
        expect(query).toContain('TTL = Interval("PT3600S") ON `createdAt` AS MILLISECONDS');
    });

    test('buildUpdateTableQuery includes drop, add and settings update actions', () => {
        const query = buildUpdateTableQuery({
            tableName: 'orders',
            columns: [{name: 'status', type: 'Utf8', notNull: false}],
            deletedColumns: [{name: 'legacy', type: 'Int32', notNull: false}],
            settings: {
                keyBloomFilter: true,
            },
        });

        expect(query).toContain('ALTER TABLE orders');
        expect(query).toContain('DROP COLUMN `legacy`');
        expect(query).toContain('ADD COLUMN `status` Utf8');
        expect(query).toContain('SET KEY_BLOOM_FILTER ENABLED');
    });

    test('getUpdateTableSettings returns only dirty settings', () => {
        const result = getUpdateTableSettings(
            {
                autoPartitionBySize: true,
                autoPartitionBySizeMb: 512,
                autoPartitionByLoad: false,
                keyBloomFilter: true,
                ttl: {
                    status: 'enabled',
                    column: 'createdAt',
                    lifetime: 3600,
                    unit: 'seconds',
                },
            },
            {
                autoPartitionBySize: true,
                ttl: {column: true},
            },
        );

        expect(result).toEqual({
            autoPartitionBySize: true,
            autoPartitionBySizeMb: 512,
            ttl: {
                status: 'enabled',
                column: 'createdAt',
                lifetime: 3600,
                unit: 'seconds',
            },
        });
    });

    test('getTablePathInfoForUpdate supports renames into nested directories', () => {
        const result = getTablePathInfoForUpdate(
            {
                Path: '/Root/orders',
                PathDescription: {
                    Self: {Name: 'orders'},
                },
            } as never,
            'archive/orders',
        );

        expect(result).toEqual({
            originalName: 'orders',
            tablePath: '/Root/orders',
            updatedTablePath: '/Root/archive/orders',
        });
    });

    test('getTablePathInfoForUpdate preserves absolute rename targets', () => {
        const result = getTablePathInfoForUpdate(
            {
                Path: '/Root/orders',
                PathDescription: {
                    Self: {Name: 'orders'},
                },
            } as never,
            '/backup/orders',
        );

        expect(result).toEqual({
            originalName: 'orders',
            tablePath: '/Root/orders',
            updatedTablePath: '/backup/orders',
        });
    });

    test('prepareFormValues parses row and column table settings from describe responses', () => {
        const rowResult = prepareFormValues({
            PathDescription: {
                Self: {Name: 'orders', PathType: EPathType.EPathTypeTable},
                Table: {
                    UniformPartitionsCount: 4,
                    PartitionConfig: {
                        PartitioningPolicy: {
                            SizeToSplit: String(512 * 1024 * 1024),
                            SplitByLoadSettings: {Enabled: true},
                            MinPartitionsCount: 2,
                            MaxPartitionsCount: 8,
                        },
                        EnableFilterByKey: true,
                        ColumnFamilies: [
                            {
                                Name: 'hot',
                                ColumnCodec: EColumnCodec.ColumnCodecLZ4,
                                StorageConfig: {Data: {PreferredPoolKind: 'ssd'}},
                            },
                        ],
                    },
                    TTLSettings: {
                        Enabled: {
                            ColumnName: 'createdAt',
                            ExpireAfterSeconds: 7200,
                            ColumnUnit: EUnit.UNIT_AUTO,
                        },
                    },
                },
            },
        } as never);

        expect(rowResult).toEqual({
            name: 'orders',
            type: 'row',
            columns: [],
            secondaryIndexes: [],
            deletedColumns: [],
            partitionKey: [],
            partitionCount: 0,
            settings: {
                partitionsType: PartitionsType.Uniform,
                uniformPartitions: 4,
                autoPartitionBySize: true,
                autoPartitionBySizeMb: 512,
                autoPartitionByLoad: true,
                autoPartitionMinPartitions: 2,
                autoPartitionMaxPartitions: 8,
                keyBloomFilter: true,
                ttl: {
                    status: 'enabled',
                    column: 'createdAt',
                    columnWithEpochMode: false,
                    lifetime: 7200,
                    unit: 'seconds',
                },
                columnFamilies: [
                    {name: 'hot', compression: 'COMPRESSION_LZ4', data: {media: 'ssd'}},
                ],
            },
        });

        const columnResult = prepareFormValues({
            PathDescription: {
                Self: {Name: 'events', PathType: EPathType.EPathTypeColumnTable},
                ColumnTableDescription: {
                    ColumnShardCount: 12,
                    Sharding: {HashSharding: {Columns: ['tenantId']}},
                    TtlSettings: {
                        Enabled: {
                            ColumnName: 'createdAt',
                            ExpireAfterSeconds: 3600,
                            ColumnUnit: EUnit.UNIT_MILLISECONDS,
                        },
                    },
                },
            },
        } as never);

        expect(columnResult).toEqual({
            name: 'events',
            type: 'column',
            columns: [],
            secondaryIndexes: [],
            deletedColumns: [],
            partitionKey: ['tenantId'],
            partitionCount: 12,
            settings: {
                ttl: {
                    status: 'enabled',
                    column: 'createdAt',
                    columnWithEpochMode: true,
                    lifetime: 3600,
                    epochMode: 'milliseconds',
                },
            },
        });
    });
});
