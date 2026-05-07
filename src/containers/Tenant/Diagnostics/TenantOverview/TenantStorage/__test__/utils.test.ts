import {EPathType} from '../../../../../../types/api/schema';
import {EType} from '../../../../../../types/api/tenant';
import {
    TENANT_STORAGE_SEGMENT_KEYS,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS,
    buildTenantStorageData,
    buildTenantStorageMediaSections,
    getTenantStorageMediaKey,
    getTenantStoragePhysicalDisplaySegments,
    getTenantStoragePhysicalMediaBreakdown,
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
                dbShare: 200 / 350,
                overhead: 1.5,
            },
        ]);
        expect(result.topRowsError).toBe(topRowsError);
    });

    test('maps old system tablet types to system physical details', () => {
        const result = buildTenantStorageData(
            {
                tabletTypeRows: [
                    {
                        Type: 'OldHive',
                        StorageSize: 10,
                        Media: [{Kind: 'SSD,Kind:0', StorageSize: 10}],
                    },
                    {
                        Type: 'OldCoordinator',
                        StorageSize: 20,
                        Media: [{Kind: 'SSD,Kind:0', StorageSize: 20}],
                    },
                    {
                        Type: 'OldSchemeShard',
                        StorageSize: 30,
                        Media: [{Kind: 'SSD,Kind:0', StorageSize: 30}],
                    },
                    {
                        Type: 'OldBSController',
                        StorageSize: 40,
                        Media: [{Kind: 'SSD,Kind:0', StorageSize: 40}],
                    },
                ],
                topRows: [],
            },
            {
                blobStorageUsed: 100,
                tabletStorageUsed: 50,
            },
        );

        expect(result.physicalSegmentsByMedia.SSD).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 100},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 0},
        ]);
        expect(result.systemDetailsByMedia.SSD).toEqual(
            expect.arrayContaining([
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive, value: 10},
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.coordinator, value: 20},
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.schemeShard, value: 30},
                {key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.bsController, value: 40},
            ]),
        );
    });

    test('maps unknown tablet media to aggregate physical breakdown', () => {
        const result = buildTenantStorageData(
            {
                tabletTypeRows: [
                    {
                        Type: 'DataShard',
                        StorageSize: 120,
                        Media: [{Kind: 'Unknown', StorageSize: 120}],
                    },
                    {
                        Type: 'Hive',
                        StorageSize: 30,
                        Media: [{Kind: 'UNKNOWN,Kind:0', StorageSize: 30}],
                    },
                ],
                topRows: [],
            },
            {
                blobStorageUsed: 150,
                tabletStorageUsed: 50,
            },
        );

        expect(getTenantStorageMediaKey('Unknown')).toBe(EType.None);
        expect(getTenantStorageMediaKey('UNKNOWN,Kind:0')).toBe(EType.None);
        expect(result.physicalSegmentsByMedia.Unknown).toBeUndefined();
        expect(result.physicalSegmentsByMedia[EType.None]).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 30},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 120},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 0},
        ]);
        expect(result.systemDetailsByMedia[EType.None]).toEqual(
            expect.arrayContaining([{key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive, value: 30}]),
        );
    });

    test('falls back to tablet storage metric for database share', () => {
        const result = buildTenantStorageData(
            {
                tabletTypeRows: [],
                topRows: [
                    {
                        path: '/local/db/table-a',
                        userData: 120,
                        physicalDisk: 360,
                    },
                ],
            },
            {
                blobStorageUsed: 900,
                tabletStorageUsed: 480,
            },
        );

        expect(result.summary.userData.used).toBe(480);
        expect(result.topRows[0]?.dbShare).toBe(120 / 480);
        expect(result.topRows[0]?.overhead).toBe(3);
    });

    test('falls back to tablet storage metric when logical user data is partial', () => {
        const result = buildTenantStorageData(
            {
                logicalUserData: {
                    rowTables: 120,
                    topics: undefined,
                },
                tabletTypeRows: [],
                topRows: [
                    {
                        path: '/local/db/table-a',
                        userData: 120,
                        physicalDisk: 360,
                    },
                ],
            },
            {
                blobStorageUsed: 900,
                tabletStorageUsed: 480,
            },
        );

        expect(result.summary.userData.used).toBe(480);
        expect(result.userDataSegments).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 120},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 360},
        ]);
        expect(result.topRows[0]?.dbShare).toBe(120 / 480);
        expect(result.topRows[0]?.overhead).toBe(3);
    });

    test('preserves missing top row physical disk size as unknown', () => {
        const result = buildTenantStorageData(
            {
                tabletTypeRows: [],
                topRows: [
                    {
                        path: '/local/db/table-a',
                        userData: 120,
                    },
                ],
            },
            {
                blobStorageUsed: 900,
                tabletStorageUsed: 480,
            },
        );

        expect(result.topRows[0]).toEqual({
            path: '/local/db/table-a',
            userData: 120,
            physicalDisk: undefined,
            dbShare: 120 / 480,
            overhead: undefined,
        });
    });

    test('falls back to aggregate tablet type storage size when media breakdown is missing', () => {
        const result = buildTenantStorageData(
            {
                tabletTypeRows: [
                    {
                        Type: 'DataShard',
                        StorageSize: 500,
                    },
                    {
                        Type: 'Hive',
                        StorageSize: 100,
                    },
                    {
                        Type: 'PersQueue',
                        StorageSize: 50,
                    },
                ],
                topRows: [],
            },
            {
                blobStorageUsed: 650,
                blobStorageLimit: 1_000,
                tabletStorageUsed: 350,
                tabletStorageLimit: 700,
            },
        );

        expect(result.physicalSegmentsByMedia[EType.None]).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 100},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 500},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 50},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 0},
        ]);
        expect(result.summary.physical.segments).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 100},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 500},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 50},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 0},
        ]);
        expect(result.summary.physical.overhead).toBeCloseTo(650 / 350);
    });

    test('uses aggregate physical breakdown for single concrete media when per-media breakdown is missing', () => {
        const result = buildTenantStorageData(
            {
                tabletTypeRows: [
                    {
                        Type: 'DataShard',
                        StorageSize: 500,
                    },
                    {
                        Type: 'Hive',
                        StorageSize: 100,
                    },
                ],
                topRows: [],
            },
            {
                blobStorageUsed: 600,
                blobStorageLimit: 1_000,
                tabletStorageUsed: 300,
                tabletStorageLimit: 700,
            },
        );

        const breakdownWithFallback = getTenantStoragePhysicalMediaBreakdown({
            allowAggregateFallback: true,
            mediaType: EType.SSD,
            physicalSegmentsByMedia: result.physicalSegmentsByMedia,
            systemDetailsByMedia: result.systemDetailsByMedia,
        });
        const breakdownWithoutFallback = getTenantStoragePhysicalMediaBreakdown({
            mediaType: EType.SSD,
            physicalSegmentsByMedia: result.physicalSegmentsByMedia,
            systemDetailsByMedia: result.systemDetailsByMedia,
        });

        expect(breakdownWithFallback.segments).toBe(result.physicalSegmentsByMedia[EType.None]);
        expect(breakdownWithFallback.systemDetails).toBe(result.systemDetailsByMedia[EType.None]);
        expect(breakdownWithFallback.segments).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 100},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 500},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 0},
        ]);
        expect(breakdownWithFallback.systemDetails).toEqual(
            expect.arrayContaining([{key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive, value: 100}]),
        );
        expect(breakdownWithoutFallback).toEqual({
            segments: undefined,
            systemDetails: undefined,
        });
    });

    test('merges aggregate and concrete physical breakdown for single concrete media', () => {
        const result = buildTenantStorageData(
            {
                tabletTypeRows: [
                    {
                        Type: 'DataShard',
                        StorageSize: 500,
                        Media: [{Kind: 'SSD,Kind:0', StorageSize: 500}],
                    },
                    {
                        Type: 'Hive',
                        StorageSize: 100,
                    },
                ],
                topRows: [],
            },
            {
                blobStorageUsed: 600,
                blobStorageLimit: 1_000,
                tabletStorageUsed: 300,
                tabletStorageLimit: 700,
            },
        );

        const breakdownWithFallback = getTenantStoragePhysicalMediaBreakdown({
            allowAggregateFallback: true,
            mediaType: EType.SSD,
            physicalSegmentsByMedia: result.physicalSegmentsByMedia,
            systemDetailsByMedia: result.systemDetailsByMedia,
        });
        const breakdownWithoutFallback = getTenantStoragePhysicalMediaBreakdown({
            mediaType: EType.SSD,
            physicalSegmentsByMedia: result.physicalSegmentsByMedia,
            systemDetailsByMedia: result.systemDetailsByMedia,
        });

        expect(breakdownWithFallback.segments).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 100},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 500},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 0},
        ]);
        expect(breakdownWithFallback.systemDetails).toEqual(
            expect.arrayContaining([{key: TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive, value: 100}]),
        );
        expect(breakdownWithoutFallback.segments).toEqual([
            {key: TENANT_STORAGE_SEGMENT_KEYS.system, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.rowTables, value: 500},
            {key: TENANT_STORAGE_SEGMENT_KEYS.columnTables, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.topics, value: 0},
            {key: TENANT_STORAGE_SEGMENT_KEYS.unknown, value: 0},
        ]);
    });

    test('returns zero database share when logical used is zero', () => {
        const result = buildTenantStorageData(
            {
                logicalUserData: {
                    rowTables: 0,
                    topics: 0,
                },
                tabletTypeRows: [],
                topRows: [
                    {
                        path: '/local/db/table-a',
                        userData: 120,
                        physicalDisk: 360,
                    },
                ],
            },
            {
                blobStorageUsed: 900,
                tabletStorageUsed: 480,
            },
        );

        expect(result.summary.userData.used).toBe(0);
        expect(result.topRows[0]?.dbShare).toBe(0);
        expect(result.topRows[0]?.overhead).toBe(3);
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

    test('estimates media user data available when quota is missing', () => {
        const result = getTenantStorageUserDataDisplaySummary({
            summary: {
                used: 120,
                quota: undefined,
                available: undefined,
                usedPercent: 0,
                segments: [],
            },
            useLogicalBreakdown: false,
            physical: {
                used: 360,
                total: 600,
                available: 240,
                usedPercent: 60,
                segments: [],
            },
        });

        expect(result.availableApproximate).toBe(true);
        expect(result.available).toBeCloseTo(80);
        expect(result.usedPercent).toBeCloseTo(60);
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

    test('normalizes and sums duplicate media stats', () => {
        const result = buildTenantStorageMediaSections({
            blobStorageStats: [
                {name: 'ssd', used: 100, limit: 1_000},
                {name: EType.SSD, used: 50, limit: 500},
            ],
            metrics: {
                blobStorageUsed: 150,
                blobStorageLimit: 1_500,
                tabletStorageUsed: 50,
                tabletStorageLimit: 300,
            },
            tabletStorageStats: [
                {name: 'SSD', used: 20, limit: 100},
                {name: 'ssd', used: 30, limit: 200},
            ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.mediaType).toBe(EType.SSD);
        expect(result[0]?.userData).toEqual({
            available: 250,
            quota: 300,
            used: 50,
            usedPercent: expect.any(Number),
            segments: [],
        });
        expect(result[0]?.physical).toEqual({
            available: 1_350,
            overhead: 3,
            total: 1_500,
            used: 150,
            usedPercent: 10,
            segments: [],
        });
        expect(result[0]?.userData.usedPercent).toBeCloseTo(16.666666666666668);
    });

    test('matches aliased blob and tablet media types', () => {
        const result = buildTenantStorageMediaSections({
            blobStorageStats: [{name: 'ROT', used: 200, limit: 400}],
            metrics: {
                blobStorageUsed: 200,
                blobStorageLimit: 400,
                tabletStorageUsed: 50,
                tabletStorageLimit: 100,
            },
            tabletStorageStats: [{name: 'hdd', used: 50, limit: 100}],
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.mediaType).toBe(EType.HDD);
        expect(result[0]?.userData.used).toBe(50);
        expect(result[0]?.userData.quota).toBe(100);
        expect(result[0]?.physical.used).toBe(200);
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

    test('uses aggregate section when blob storage stats have only None fallback', () => {
        const result = buildTenantStorageMediaSections({
            blobStorageStats: [{name: EType.None, used: 1_000, limit: 3_000}],
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

        expect(result).toHaveLength(1);
        expect(result[0]?.mediaType).toBe(EType.None);
        expect(result[0]?.userData.used).toBe(300);
        expect(result[0]?.physical.used).toBe(1_000);
    });

    test('uses aggregate section when blob stats have media split but tablet stats are aggregate', () => {
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
            tabletStorageStats: [{name: EType.None, used: 300, limit: 700}],
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.mediaType).toBe(EType.None);
        expect(result[0]?.userData).toEqual({
            available: 400,
            quota: 700,
            used: 300,
            usedPercent: expect.any(Number),
            segments: [],
        });
        expect(result[0]?.physical).toEqual({
            available: 2_000,
            overhead: expect.any(Number),
            total: 3_000,
            used: 1_000,
            usedPercent: expect.any(Number),
            segments: [],
        });
        expect(result[0]?.userData.usedPercent).toBeCloseTo(42.857142857142854);
        expect(result[0]?.physical.overhead).toBeCloseTo(1_000 / 300);
        expect(result[0]?.physical.usedPercent).toBeCloseTo(33.333333333333336);
    });

    test('uses aggregate tablet fallback for a single concrete blob media section', () => {
        const result = buildTenantStorageMediaSections({
            blobStorageStats: [{name: EType.SSD, used: 1_000, limit: 3_000}],
            metrics: {
                blobStorageUsed: 1_000,
                blobStorageLimit: 3_000,
                tabletStorageUsed: 300,
                tabletStorageLimit: 700,
            },
            tabletStorageStats: [{name: EType.None, used: 300, limit: 700}],
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.mediaType).toBe(EType.SSD);
        expect(result[0]?.userData.used).toBe(300);
        expect(result[0]?.userData.quota).toBe(700);
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
