import {EPathType} from '../../../../../../types/api/schema';
import {EType as ETabletType} from '../../../../../../types/api/tablet';
import {EType} from '../../../../../../types/api/tenant';
import {
    TENANT_STORAGE_SEGMENT_KEYS,
    buildTenantStorageData,
    buildTenantStorageMediaSections,
    isSystemStoragePath,
} from '../utils';

describe('buildTenantStorageData', () => {
    test('maps tablet types to user and physical segments and calculates derived metrics', () => {
        const result = buildTenantStorageData(
            {
                tabletTypeRows: [
                    {Type: ETabletType.DataShard, DataSize: 300, StorageSize: 500},
                    {Type: ETabletType.ColumnShard, DataSize: 100, StorageSize: 150},
                    {Type: ETabletType.PersQueue, DataSize: 50, StorageSize: 75},
                    {Type: ETabletType.PersQueueReadBalancer, DataSize: 0, StorageSize: 25},
                ],
                topRows: [
                    {
                        path: '/local/db/table-a',
                        pathType: EPathType.EPathTypeTable,
                        userData: 200,
                        physicalDisk: 300,
                    },
                ],
            },
            {
                blobStorageUsed: 900,
                blobStorageLimit: 1_200,
                tabletStorageUsed: 450,
                tabletStorageLimit: 1_000,
            },
        );

        expect(result.summary.userData.used).toBe(450);
        expect(result.summary.userData.available).toBe(550);
        expect(result.summary.userData.usedPercent).toBe(45);
        expect(result.summary.userData.segments).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 300},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 100},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 50},
        ]);

        expect(result.summary.physical.used).toBe(900);
        expect(result.summary.physical.available).toBe(300);
        expect(result.summary.physical.total).toBe(1_200);
        expect(result.summary.physical.usedPercent).toBe(75);
        expect(result.summary.physical.overhead).toBe(2);
        expect(result.summary.physical.segments).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 175},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 500},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 150},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 75},
        ]);

        expect(result.topRows).toEqual([
            {
                path: '/local/db/table-a',
                pathType: EPathType.EPathTypeTable,
                userData: 200,
                physicalDisk: 300,
                dbShare: 300 / 900,
                overhead: 1.5,
            },
        ]);
    });

    test('falls back to overview tablet storage when user data breakdown is unavailable', () => {
        const result = buildTenantStorageData(
            {
                tabletTypeRows: [],
                topRows: [],
            },
            {
                blobStorageUsed: 600,
                blobStorageLimit: 1_000,
                tabletStorageUsed: 240,
                tabletStorageLimit: 500,
            },
        );

        expect(result.summary.userData.used).toBe(240);
        expect(result.summary.userData.available).toBe(260);
        expect(result.summary.physical.overhead).toBe(2.5);
        expect(result.summary.userData.segments).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 0},
        ]);
    });

    test('treats paths under .sys and .metadata as system objects', () => {
        expect(isSystemStoragePath('/local/db/.sys/internal/table')).toBe(true);
        expect(isSystemStoragePath('/local/db/.metadata/migrations')).toBe(true);
        expect(isSystemStoragePath('/local/db/regular-table')).toBe(false);
    });

    test('builds media sections from TablesStorage and DatabaseStorage', () => {
        const result = buildTenantStorageMediaSections({
            blobStorageStats: [
                {name: EType.SSD, used: 400, limit: 1_000},
                {name: EType.HDD, used: 600, limit: 2_000},
            ],
            metrics: {
                blobStorageUsed: 1_000,
                blobStorageLimit: 3_000,
                tabletStorageUsed: 300,
                tabletStorageLimit: 700,
            },
            tabletStorageStats: [
                {name: EType.SSD, used: 250, limit: 500},
                {name: EType.HDD, used: 50, limit: 200},
            ],
        });

        expect(result).toEqual([
            {
                mediaType: EType.SSD,
                userData: {
                    available: 250,
                    quota: 500,
                    used: 250,
                    usedPercent: 50,
                    segments: [],
                },
                physical: {
                    available: 600,
                    overhead: 1.6,
                    total: 1_000,
                    used: 400,
                    usedPercent: 40,
                    segments: [],
                },
            },
            {
                mediaType: EType.HDD,
                userData: {
                    available: 150,
                    quota: 200,
                    used: 50,
                    usedPercent: 25,
                    segments: [],
                },
                physical: {
                    available: 1_400,
                    overhead: 12,
                    total: 2_000,
                    used: 600,
                    usedPercent: 30,
                    segments: [],
                },
            },
        ]);
    });

    test('falls back to overall quotas for single-media sections when per-type limits are missing', () => {
        const result = buildTenantStorageMediaSections({
            blobStorageStats: [{name: EType.SSD, used: 500}],
            metrics: {
                blobStorageUsed: 500,
                blobStorageLimit: 8_600,
                tabletStorageUsed: 35.8,
                tabletStorageLimit: 120,
            },
            tabletStorageStats: [{name: EType.SSD, used: 35.8}],
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.mediaType).toBe(EType.SSD);
        expect(result[0]?.userData).toEqual({
            available: 84.2,
            quota: 120,
            used: 35.8,
            usedPercent: expect.any(Number),
            segments: [],
        });
        expect(result[0]?.physical).toEqual({
            available: 8_100,
            overhead: expect.any(Number),
            total: 8_600,
            used: 500,
            usedPercent: expect.any(Number),
            segments: [],
        });
        expect(result[0]?.userData.usedPercent).toBeCloseTo(29.833333333333332);
        expect(result[0]?.physical.overhead).toBeCloseTo(500 / 35.8);
        expect(result[0]?.physical.usedPercent).toBeCloseTo(5.813953488372093);
    });
});
