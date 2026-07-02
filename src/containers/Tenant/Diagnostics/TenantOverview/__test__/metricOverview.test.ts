import {EFlag} from '../../../../../types/api/enums';
import {EType} from '../../../../../types/api/tenant';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
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
    test('builds tab metrics and page summaries from the same aggregates', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
            coresTotal: 100,
            poolsStats: [
                {name: 'System', used: 5, limit: 100},
                {name: 'User', used: 2.3, limit: 100},
                {name: 'IO', used: 90, limit: 100},
            ],
            memoryStats: [{used: 536_870_912, limit: 1_073_741_824}],
            storageMetricStats: [{used: 900, limit: 1_000}],
            networkUtilization: 0.96,
            networkThroughput: 1_048_576,
        });

        expect(metrics.tabs.cpu).toEqual({
            percentText: '7%',
            status: EFlag.Green,
        });
        expect(metrics.tabs.memory).toEqual({
            percentText: '50%',
            status: EFlag.Green,
        });
        expect(metrics.tabs.storage).toEqual({
            percentText: '90%',
            status: EFlag.Yellow,
        });
        expect(metrics.tabs.network).toEqual({
            percentText: '96%',
            status: EFlag.Red,
        });

        expect(metrics.summaries.cpu?.presentation.percentText).toBe('7%');
        expect(metrics.summaries.memory?.presentation.percentText).toBe('50%');
        expect(metrics.summaries.network?.presentation.percentText).toBe('96%');
    });

    test('keeps network metrics when throughput is missing', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
            poolsStats: [{name: 'System', used: 5, limit: 100}],
            memoryStats: [{used: 50, limit: 100}],
            storageMetricStats: [{used: 900, limit: 1_000}],
            networkUtilization: 0.42,
        });

        expect(metrics.tabs.network).toEqual({
            percentText: '42%',
            status: EFlag.Green,
        });
        expect(metrics.summaries.network?.presentation).toEqual({
            percentText: '42%',
            progressTheme: 'success',
            progressValue: 42,
            valueText: undefined,
        });
    });

    test('omits memory summary value text when memory limit is missing', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
            poolsStats: [{name: 'System', used: 5, limit: 100}],
            memoryStats: [{used: 536_870_912, limit: undefined}],
            storageMetricStats: [{used: 900, limit: 1_000}],
        });

        expect(metrics.tabs.memory).toEqual({
            percentText: 'N/A',
            status: EFlag.Grey,
        });
        expect(metrics.summaries.memory?.presentation).toEqual({
            percentText: EMPTY_DATA_PLACEHOLDER,
            progressValue: 0,
            valueText: undefined,
        });
    });

    test('omits cpu summary value text when cpu limit is missing', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
            poolsStats: [{name: 'System', used: 5, limit: undefined}],
            memoryStats: [{used: 50, limit: 100}],
            storageMetricStats: [{used: 900, limit: 1_000}],
        });

        expect(metrics.tabs.cpu).toEqual({
            percentText: 'N/A',
            status: EFlag.Grey,
        });
        expect(metrics.summaries.cpu?.presentation).toEqual({
            percentText: EMPTY_DATA_PLACEHOLDER,
            progressValue: 0,
            valueText: undefined,
        });
    });

    test('keeps page summaries in empty state when metric data is missing', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: false,
        });

        expect(metrics.tabs.cpu).toEqual({
            percentText: 'N/A',
            status: EFlag.Grey,
        });
        expect(metrics.tabs.memory).toEqual({
            percentText: 'N/A',
            status: EFlag.Grey,
        });
        expect(metrics.tabs.storage).toEqual({
            percentText: 'N/A',
            status: EFlag.Grey,
        });
        expect(metrics.tabs.network).toBeUndefined();
        expect(metrics.summaries.cpu?.presentation).toEqual({
            percentText: EMPTY_DATA_PLACEHOLDER,
            progressValue: 0,
            valueText: undefined,
        });
        expect(metrics.summaries.memory?.presentation).toEqual({
            percentText: EMPTY_DATA_PLACEHOLDER,
            progressValue: 0,
            valueText: undefined,
        });
        expect(metrics.summaries.network).toBeUndefined();
    });

    test('omits metric data for serverless', () => {
        const metrics = getTenantOverviewMetrics({
            isServerless: true,
            poolsStats: [{name: 'System', used: 5, limit: 100}],
            memoryStats: [{used: 50, limit: 100}],
            tabletStorageStats: [{used: 100, limit: undefined}],
            blobStorageStats: [{used: 500, limit: 1_000}],
            networkUtilization: 0.96,
            networkThroughput: 1_048_576,
        });

        expect(metrics.tabs).toEqual({});
        expect(metrics.summaries).toEqual({});
    });
});
