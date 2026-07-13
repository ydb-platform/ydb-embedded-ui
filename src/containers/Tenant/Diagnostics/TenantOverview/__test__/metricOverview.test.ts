import {EFlag} from '../../../../../types/api/enums';
import {EType} from '../../../../../types/api/tenant';
import {UNBREAKABLE_GAP} from '../../../../../utils/constants';
import {getTenantOverviewMetrics, selectStorageStatsForMetricCard} from '../metricOverview';

describe('selectStorageStatsForMetricCard', () => {
    test('keeps prod legacy fallback to database storage when tablet storage has no limit', () => {
        const blobStorageStats = [
            {
                name: EType.SSD,
                used: 492_778_291_200,
                limit: 6_399_113_297_920,
                usage: 7.7,
            },
        ];
        const tabletStorageStats = [
            {
                name: EType.SSD,
                used: 35_915_303_563,
                limit: undefined,
                usage: undefined,
            },
        ];

        expect(
            selectStorageStatsForMetricCard({
                blobStorageStats,
                tabletStorageStats,
            }),
        ).toBe(blobStorageStats);
    });

    test('keeps quota-based tablet storage priority from main', () => {
        const blobStorageStats = [
            {
                name: EType.SSD,
                used: 492_778_291_200,
                limit: 6_399_113_297_920,
                usage: 7.7,
            },
        ];
        const tabletStorageStats = [
            {
                name: EType.SSD,
                used: 289_166_965_049,
                limit: 612_032_839_680,
                usage: 47.2,
            },
        ];

        expect(
            selectStorageStatsForMetricCard({
                blobStorageStats,
                tabletStorageStats,
            }),
        ).toBe(tabletStorageStats);
    });
});

describe('getTenantOverviewMetrics', () => {
    test('builds metric data from the same aggregates', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
            coresTotal: 100,
            poolsStats: [
                {name: 'System', used: 5, limit: 100},
                {name: 'User', used: 2.3, limit: 100},
                {name: 'IO', used: 90, limit: 100},
            ],
            memoryStats: [{used: 1_000_000_000, limit: 2_000_000_000}],
            storageMetricStats: [{used: 900, limit: 1_000}],
            networkUtilization: 0.96,
        });

        expect(metrics.cpu).toMatchObject({
            percentText: '7%',
            progressTheme: 'success',
            progressValue: 7,
            status: EFlag.Green,
            value: 7.3,
            capacity: 100,
            legend: '7 of 100 cores',
        });
        expect(metrics.memory).toMatchObject({
            percentText: '50%',
            progressTheme: 'success',
            progressValue: 50,
            status: EFlag.Green,
            value: 1_000_000_000,
            capacity: 2_000_000_000,
            legend: `1 of 2${UNBREAKABLE_GAP}GB`,
        });
        expect(metrics.storage).toMatchObject({
            percentText: '90%',
            progressTheme: 'warning',
            progressValue: 90,
            status: EFlag.Yellow,
            value: 900,
            capacity: 1_000,
        });
        expect(metrics.network).toMatchObject({
            percentText: '96%',
            progressTheme: 'danger',
            progressValue: 96,
            status: EFlag.Red,
        });
    });

    test('keeps network metrics when throughput is missing', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
            poolsStats: [{name: 'System', used: 5, limit: 100}],
            memoryStats: [{used: 50, limit: 100}],
            storageMetricStats: [{used: 900, limit: 1_000}],
            networkUtilization: 0.42,
        });

        expect(metrics.network).toMatchObject({
            percentText: '42%',
            progressTheme: 'success',
            progressValue: 42,
            status: EFlag.Green,
        });
    });

    test('keeps zero percent as available metric data', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
            poolsStats: [{name: 'System', used: 0, limit: 100}],
            memoryStats: [{used: 0, limit: 100}],
            storageMetricStats: [{used: 0, limit: 100}],
            networkUtilization: 0,
        });

        expect(metrics.cpu).toMatchObject({
            percentText: '0%',
            progressTheme: 'success',
            progressValue: 0,
            status: EFlag.Green,
        });
        expect(metrics.memory).toMatchObject({
            percentText: '0%',
            progressTheme: 'success',
            progressValue: 0,
            status: EFlag.Green,
        });
        expect(metrics.storage).toMatchObject({
            percentText: '0%',
            progressTheme: 'success',
            progressValue: 0,
            status: EFlag.Green,
        });
        expect(metrics.network).toMatchObject({
            percentText: '0%',
            progressTheme: 'success',
            progressValue: 0,
            status: EFlag.Green,
        });
    });

    test('marks memory percent unavailable when memory limit is missing', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
            poolsStats: [{name: 'System', used: 5, limit: 100}],
            memoryStats: [{used: 536_870_912, limit: undefined}],
            storageMetricStats: [{used: 900, limit: 1_000}],
        });

        expect(metrics.memory).toMatchObject({
            percentText: undefined,
            progressTheme: 'neutral',
            progressValue: 0,
            status: EFlag.Grey,
            value: 536_870_912,
            capacity: 0,
            legend: undefined,
        });
    });

    test('marks cpu percent unavailable when cpu limit is missing', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
            poolsStats: [{name: 'System', used: 5, limit: undefined}],
            memoryStats: [{used: 50, limit: 100}],
            storageMetricStats: [{used: 900, limit: 1_000}],
        });

        expect(metrics.cpu).toMatchObject({
            percentText: undefined,
            progressTheme: 'neutral',
            progressValue: 0,
            status: EFlag.Grey,
            value: 5,
            capacity: 0,
            legend: undefined,
        });
    });

    test('keeps dedicated metrics in empty state when metric data is missing', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
        });

        expect(metrics.cpu).toMatchObject({
            percentText: undefined,
            progressTheme: 'neutral',
            progressValue: 0,
            status: EFlag.Grey,
        });
        expect(metrics.memory).toMatchObject({
            percentText: undefined,
            progressTheme: 'neutral',
            progressValue: 0,
            status: EFlag.Grey,
        });
        expect(metrics.storage).toMatchObject({
            percentText: undefined,
            progressTheme: 'neutral',
            progressValue: 0,
            status: EFlag.Grey,
        });
        expect(metrics.network).toBeUndefined();
    });

    test('omits metric data for serverless', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: true,
            poolsStats: [{name: 'System', used: 5, limit: 100}],
            memoryStats: [{used: 50, limit: 100}],
            tabletStorageStats: [{used: 100, limit: undefined}],
            blobStorageStats: [{used: 500, limit: 1_000}],
            networkUtilization: 0.96,
        });

        expect(metrics).toEqual({});
    });
});
