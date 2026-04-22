import {EPathType} from '../../../../../../types/api/schema';
import {EType} from '../../../../../../types/api/tenant';
import {
    TENANT_STORAGE_SEGMENT_KEYS,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS,
    buildTenantStorageData,
    buildTenantStorageMediaSections,
    getTenantStoragePhysicalDisplaySegments,
    getTenantStorageUserDataDisplaySummary,
    isSystemStoragePath,
    mergeSystemDetailsByMedia,
} from '../utils';

describe('buildTenantStorageData', () => {
    test('maps logical user data and physical segments by media', () => {
        const topRowsError = new Error('top rows failed');
        const result = buildTenantStorageData(
            {
                logicalUserData: {
                    rowTables: 300,
                    topics: 50,
                },
                tabletTypeRows: [
                    {
                        Type: 'DataShard',
                        StorageSize: 500,
                        Media: [{Kind: 'SSD,Kind:0', StorageSize: 500}],
                    },
                    {
                        Type: 'ColumnShard',
                        StorageSize: 150,
                        Media: [{Kind: 'SSD,Kind:0', StorageSize: 150}],
                    },
                    {
                        Type: 'PersQueue',
                        StorageSize: 75,
                        Media: [{Kind: 'ROT,Kind:0', StorageSize: 75}],
                    },
                    {
                        Type: 'PersQueueReadBalancer',
                        StorageSize: 25,
                        Media: [{Kind: 'ROT,Kind:0', StorageSize: 25}],
                    },
                    {
                        Type: 'Hive',
                        StorageSize: 175,
                        Media: [{Kind: 'SSD,Kind:0', StorageSize: 175}],
                    },
                    {
                        Type: 'Unknown',
                        StorageSize: 50,
                        Media: [{Kind: 'SSD,Kind:0', StorageSize: 50}],
                    },
                ],
                topRows: [
                    {
                        path: '/local/db/table-a',
                        pathType: EPathType.EPathTypeTable,
                        userData: 200,
                        physicalDisk: 300,
                    },
                ],
                topRowsError,
            },
            {
                blobStorageUsed: 950,
                blobStorageLimit: 1_200,
                tabletStorageUsed: 450,
                tabletStorageLimit: 1_000,
            },
        );

        expect(result.logicalUserData).toEqual({
            rowTables: 300,
            topics: 50,
        });
        expect(result.userDataSegments).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 300},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 50},
        ]);
        expect(result.summary.userData.used).toBe(350);
        expect(result.summary.userData.available).toBe(650);

        expect(result.physicalSegmentsByMedia.SSD).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 175},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 500},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 150},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 50},
        ]);
        expect(result.physicalSegmentsByMedia.HDD).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 100},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 0},
        ]);
        expect(result.systemDetailsByMedia.SSD).toEqual([
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive, value: 175},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.coordinator, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.mediator, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.schemeShard, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.sysViewProcessor, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.graphShard, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.statisticsAggregator, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.bsController, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.cms, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.nodeBroker, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.tenantSlotBroker, value: 0},
            {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.console, value: 0},
        ]);
        expect(result.summary.physical.used).toBe(950);
        expect(result.summary.physical.overhead).toBeCloseTo(950 / 350);

        expect(result.topRows).toEqual([
            {
                path: '/local/db/table-a',
                pathType: EPathType.EPathTypeTable,
                userData: 200,
                physicalDisk: 300,
                dbShare: 300 / 950,
                overhead: 1.5,
            },
        ]);
        expect(result.topRowsError).toBe(topRowsError);
    });

    test('adds unknown remainder to physical display segments', () => {
        const result = getTenantStoragePhysicalDisplaySegments({
            segments: [
                {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 175},
                {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 500},
                {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 150},
                {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 100},
                {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 0},
            ],
            used: 1_000,
        });

        expect(result).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 175},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 500},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 150},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 100},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 75},
        ]);
    });

    test('uses logical user data only when requested', () => {
        const result = getTenantStorageUserDataDisplaySummary({
            summary: {
                used: 120,
                quota: 300,
                available: 180,
                usedPercent: 40,
                segments: [],
            },
            logicalUserData: {
                rowTables: 60,
                topics: 20,
            },
            useLogicalBreakdown: true,
            physical: {
                used: 400,
                total: 800,
                available: 400,
                usedPercent: 50,
                segments: [],
            },
        });

        expect(result).toEqual({
            used: 80,
            quota: 300,
            available: 220,
            usedPercent: expect.any(Number),
            segments: [],
        });
        expect(result.usedPercent).toBeCloseTo(26.666666666666668);
    });

    test('keeps summary unchanged when logical breakdown is disabled', () => {
        const summary = {
            used: 120,
            quota: 300,
            available: 180,
            usedPercent: 40,
            segments: [],
        };

        expect(
            getTenantStorageUserDataDisplaySummary({
                summary,
                logicalUserData: {
                    rowTables: 60,
                    topics: 20,
                },
                useLogicalBreakdown: false,
                physical: {
                    used: 400,
                    total: 800,
                    available: 400,
                    usedPercent: 50,
                    segments: [],
                },
            }),
        ).toBe(summary);
    });

    test('estimates logical available when quota is missing', () => {
        const result = getTenantStorageUserDataDisplaySummary({
            summary: {
                used: 120,
                quota: undefined,
                available: undefined,
                usedPercent: 0,
                segments: [],
            },
            logicalUserData: {
                rowTables: 100,
                topics: 20,
            },
            useLogicalBreakdown: true,
            physical: {
                used: 360,
                total: 600,
                available: 240,
                usedPercent: 60,
                segments: [],
            },
        });

        expect(result.availableApproximate).toBe(true);
        expect(result.used).toBe(120);
        expect(result.available).toBeCloseTo(80);
        expect(result.total).toBeCloseTo(200);
        expect(result.usedPercent).toBeCloseTo(60);
        expect(result.quota).toBeUndefined();
    });

    test('does not estimate logical available when overhead inputs are missing', () => {
        const result = getTenantStorageUserDataDisplaySummary({
            summary: {
                used: 0,
                quota: undefined,
                available: undefined,
                usedPercent: 0,
                segments: [],
            },
            logicalUserData: {
                rowTables: 0,
                topics: 0,
            },
            useLogicalBreakdown: true,
            physical: {
                used: 360,
                total: 600,
                available: 240,
                usedPercent: 60,
                segments: [],
            },
        });

        expect(result.availableApproximate).toBeUndefined();
        expect(result.available).toBeUndefined();
        expect(result.total).toBeUndefined();
        expect(result.usedPercent).toBe(0);
    });

    test('treats paths under .sys and .metadata as system objects', () => {
        expect(isSystemStoragePath('/local/db/.sys/internal/table')).toBe(true);
        expect(isSystemStoragePath('/local/db/.metadata/migrations')).toBe(true);
        expect(isSystemStoragePath('/local/db/regular-table')).toBe(false);
    });

    test('aggregates system details across media', () => {
        const result = mergeSystemDetailsByMedia({
            SSD: [
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive, value: 10},
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.coordinator, value: 3},
            ],
            HDD: [
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive, value: 15},
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.schemeShard, value: 7},
            ],
        });

        expect(result).toEqual(
            expect.arrayContaining([
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive, value: 25},
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.coordinator, value: 3},
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.schemeShard, value: 7},
            ]),
        );
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

    test('uses aggregate section when only tablet stats have media split', () => {
        const result = buildTenantStorageMediaSections({
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
                mediaType: EType.None,
                userData: {
                    available: 400,
                    quota: 700,
                    used: 300,
                    usedPercent: expect.any(Number),
                    segments: [],
                },
                physical: {
                    available: 2_000,
                    overhead: expect.any(Number),
                    total: 3_000,
                    used: 1_000,
                    usedPercent: expect.any(Number),
                    segments: [],
                },
            },
        ]);
        expect(result[0]?.userData.usedPercent).toBeCloseTo(42.857142857142854);
        expect(result[0]?.physical.overhead).toBeCloseTo(1_000 / 300);
        expect(result[0]?.physical.usedPercent).toBeCloseTo(33.333333333333336);
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
