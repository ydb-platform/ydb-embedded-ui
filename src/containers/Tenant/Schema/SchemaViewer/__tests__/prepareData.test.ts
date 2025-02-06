import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {EPathType} from '../../../../../types/api/schema';
import {prepareSchemaData, prepareViewSchema} from '../prepareData';

describe('prepareSchemaData', () => {
    it('correctly parses row table data', () => {
        const data: TEvDescribeSchemeResult = {
            PathDescription: {
                Table: {
                    Name: 'my_row_table',
                    Columns: [
                        {
                            Name: 'id',
                            Type: 'Uint64',
                            TypeId: 4,
                            Id: 1,
                            Family: 0,
                            FamilyName: 'default',
                            NotNull: false,
                        },
                        {
                            Name: 'category_id',
                            Type: 'Uint64',
                            TypeId: 4,
                            Id: 2,
                            Family: 0,
                            FamilyName: 'default',
                            NotNull: true,
                        },
                        {
                            Name: 'name',
                            Type: 'Utf8',
                            TypeId: 4608,
                            Id: 3,
                            Family: 0,
                            FamilyName: 'default',
                            DefaultFromLiteral: {
                                type: {
                                    type_id: 'UTF8',
                                },
                                value: {
                                    text_value: 'Ivan',
                                },
                            },
                            NotNull: true,
                        },
                        {
                            Name: 'updated_on',
                            Type: 'Datetime',
                            TypeId: 49,
                            Id: 4,
                            Family: 0,
                            FamilyName: 'default',
                            NotNull: false,
                        },
                    ],
                    KeyColumnNames: ['category_id', 'name', 'id'],
                    KeyColumnIds: [2, 3, 1],
                    PartitionConfig: {
                        ColumnFamilies: [
                            {
                                Id: 0,
                                StorageConfig: {
                                    SysLog: {
                                        PreferredPoolKind: 'ssd',
                                    },
                                    Log: {
                                        PreferredPoolKind: 'ssd',
                                    },
                                    Data: {
                                        PreferredPoolKind: 'ssd',
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        };

        const result = [
            {
                id: 1,
                name: 'id',
                keyColumnIndex: 2,
                type: 'Uint64',
                notNull: false,
                autoIncrement: false,
                defaultValue: '-',
                familyName: undefined,
                prefferedPoolKind: undefined,
                columnCodec: undefined,
            },
            {
                id: 2,
                name: 'category_id',
                keyColumnIndex: 0,
                type: 'Uint64',
                notNull: true,
                autoIncrement: false,
                defaultValue: '-',
                familyName: undefined,
                prefferedPoolKind: undefined,
                columnCodec: undefined,
            },
            {
                id: 3,
                name: 'name',
                keyColumnIndex: 1,
                type: 'Utf8',
                notNull: true,
                autoIncrement: false,
                defaultValue: 'Ivan',
                familyName: undefined,
                prefferedPoolKind: undefined,
                columnCodec: undefined,
            },
            {
                id: 4,
                name: 'updated_on',
                keyColumnIndex: -1,
                type: 'Datetime',
                notNull: false,
                autoIncrement: false,
                defaultValue: '-',
                familyName: undefined,
                prefferedPoolKind: undefined,
                columnCodec: undefined,
            },
        ];

        expect(prepareSchemaData(EPathType.EPathTypeTable, data)).toEqual(result);
    });
    it('correctly parses column table data', () => {
        const data: TEvDescribeSchemeResult = {
            PathDescription: {
                ColumnTableDescription: {
                    Name: 'my_column_table',
                    Schema: {
                        Columns: [
                            {
                                Id: 1,
                                Name: 'title',
                                Type: 'Utf8',
                                TypeId: 4608,
                                NotNull: true,
                                StorageId: '',
                                DefaultValue: {},
                                ColumnFamilyId: 0,
                            },
                            {
                                Id: 2,
                                Name: 'author',
                                Type: 'Utf8',
                                TypeId: 4608,
                                NotNull: true,
                                StorageId: '',
                                DefaultValue: {},
                                ColumnFamilyId: 0,
                            },
                            {
                                Id: 3,
                                Name: 'id',
                                Type: 'Int64',
                                TypeId: 3,
                                NotNull: true,
                                StorageId: '',
                                DefaultValue: {},
                                ColumnFamilyId: 0,
                            },
                            {
                                Id: 4,
                                Name: 'body',
                                Type: 'Utf8',
                                TypeId: 4608,
                                NotNull: false,
                                StorageId: '',
                                DefaultValue: {},
                                ColumnFamilyId: 0,
                            },
                        ],
                        KeyColumnNames: ['author', 'title', 'id'],
                        Version: '1',
                        Options: {
                            SchemeNeedActualization: false,
                        },
                        ColumnFamilies: [
                            {
                                Id: 0,
                                Name: 'default',
                            },
                        ],
                    },
                    ColumnShardCount: 64,
                    Sharding: {
                        ColumnShards: ['72075186224107692'],
                        HashSharding: {
                            Function: 'HASH_FUNCTION_CONSISTENCY_64',
                            Columns: ['id', 'author', 'title'],
                        },
                    },
                    StorageConfig: {
                        DataChannelCount: 64,
                    },
                },
            },
        };
        const result = [
            {
                id: 1,
                name: 'title',
                keyColumnIndex: 1,
                partitioningColumnIndex: 2,
                type: 'Utf8',
                notNull: true,
            },
            {
                id: 2,
                name: 'author',
                keyColumnIndex: 0,
                partitioningColumnIndex: 1,
                type: 'Utf8',
                notNull: true,
            },
            {
                id: 3,
                name: 'id',
                keyColumnIndex: 2,
                partitioningColumnIndex: 0,
                type: 'Int64',
                notNull: true,
            },
            {
                id: 4,
                name: 'body',
                keyColumnIndex: -1,
                partitioningColumnIndex: -1,
                type: 'Utf8',
                notNull: false,
            },
        ];
        expect(prepareSchemaData(EPathType.EPathTypeColumnTable, data)).toEqual(result);
    });
    it('returns empty array if data is undefined, empty or null', () => {
        expect(prepareSchemaData(EPathType.EPathTypeTable, {})).toEqual([]);
        expect(prepareSchemaData(EPathType.EPathTypeTable, undefined)).toEqual([]);
        expect(prepareSchemaData(EPathType.EPathTypeTable, null)).toEqual([]);
    });
});

describe('prepareViewSchema', () => {
    it('correctly parses data', () => {
        const data = [
            {name: 'cost', type: 'Int32'},
            {name: 'id', type: 'Int32'},
            {name: 'price', type: 'Double'},
            {name: 'value', type: 'Utf8?'},
        ];
        const result = [
            {type: 'Int32', name: 'cost'},
            {type: 'Int32', name: 'id'},
            {type: 'Double', name: 'price'},
            {type: 'Utf8', name: 'value'},
        ];

        expect(prepareViewSchema(data)).toEqual(result);
    });
    it('returns empty array if data is undefined or empty', () => {
        expect(prepareViewSchema()).toEqual([]);
        expect(prepareViewSchema([])).toEqual([]);
    });
});
