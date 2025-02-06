import {getPartitioningKeys, getPrimaryKeys} from '../utils';

describe('getPartitioningKeys', () => {
    it('returns column in the provided order', () => {
        const data1 = [
            {
                id: 1,
                name: 'l_linenumber',
                keyColumnIndex: 0,
                partitioningColumnIndex: 1,
                type: 'Int64',
                notNull: true,
            },
            {
                id: 2,
                name: 'l_orderkey',
                keyColumnIndex: 1,
                partitioningColumnIndex: 0,
                type: 'Int64',
                notNull: true,
            },
        ];

        expect(getPartitioningKeys(data1)).toEqual(['l_orderkey', 'l_linenumber']);

        const data2 = [
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
        expect(getPartitioningKeys(data2)).toEqual(['id', 'author', 'title']);
    });
});

describe('getPrimaryKeys', () => {
    it('returns column in the provided order', () => {
        const data = [
            {
                id: 1,
                name: 'id',
                keyColumnIndex: 2,
                type: 'Uint64',
                notNull: false,
                autoIncrement: false,
            },
            {
                id: 2,
                name: 'category_id',
                keyColumnIndex: 0,
                type: 'Uint64',
                notNull: true,
                autoIncrement: false,
            },
            {
                id: 3,
                name: 'name',
                keyColumnIndex: 1,
                type: 'Utf8',
                notNull: true,
                autoIncrement: false,
            },
            {
                id: 4,
                name: 'updated_on',
                keyColumnIndex: -1,
                type: 'Datetime',
                notNull: false,
                autoIncrement: false,
            },
        ];

        expect(getPrimaryKeys(data)).toEqual(['category_id', 'name', 'id']);
    });
});
