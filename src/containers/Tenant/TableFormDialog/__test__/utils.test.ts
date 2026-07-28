import {skipToken} from '@reduxjs/toolkit/query';

import {EPathType} from '../../../../types/api/schema/schema';
import {describeOriginalTable, getTableQueryArgs} from '../utils';

describe('TableFormDialog utils', () => {
    test('describeOriginalTable exposes the current backend ttl column and index columns', () => {
        const rowTable = describeOriginalTable({
            PathDescription: {
                Self: {Name: 'orders', PathType: EPathType.EPathTypeTable},
                Table: {
                    Columns: [],
                    KeyColumnNames: [],
                    TableIndexes: [
                        {
                            Name: 'by_status',
                            KeyColumnNames: ['status'],
                            DataColumnNames: ['createdAt'],
                        },
                    ],
                    TTLSettings: {Enabled: {ColumnName: 'createdAt'}},
                },
            },
        } as never);

        const columnTable = describeOriginalTable({
            PathDescription: {
                Self: {Name: 'events', PathType: EPathType.EPathTypeColumnTable},
                ColumnTableDescription: {
                    Schema: {Columns: [], KeyColumnNames: []},
                    TtlSettings: {Enabled: {ColumnName: 'eventAt'}},
                },
            },
        } as never);

        expect(rowTable).toMatchObject({
            hasTtl: true,
            ttlColumn: 'createdAt',
            indexes: [{name: 'by_status', columns: ['status', 'createdAt']}],
        });
        expect(columnTable).toMatchObject({
            hasTtl: true,
            ttlColumn: 'eventAt',
        });
    });

    test('getTableQueryArgs preserves meta-proxy context for update mode', () => {
        expect(
            getTableQueryArgs({
                mode: 'update',
                path: '/Root/db1/orders',
                database: '/Root/db1',
                databaseFullPath: '/Root/db1',
                useMetaProxy: true,
            }),
        ).toEqual({
            database: '/Root/db1',
            path: {
                path: '/Root/db1/orders',
                databaseFullPath: '/Root/db1',
                useMetaProxy: true,
            },
        });
    });

    test('getTableQueryArgs skips the load query outside update mode', () => {
        expect(
            getTableQueryArgs({
                mode: 'create',
                path: '/Root/db1/orders',
                database: '/Root/db1',
                databaseFullPath: '/Root/db1',
                useMetaProxy: true,
            }),
        ).toBe(skipToken);
    });
});
