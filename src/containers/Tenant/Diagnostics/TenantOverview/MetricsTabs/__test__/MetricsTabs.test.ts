import {EFlag} from '../../../../../../types/api/enums';
import {EType} from '../../../../../../types/api/tenant';
import {selectStorageStatsForMetricCard} from '../MetricsTabs';
import {getMetricTabPresentation, getUsageMetricTabPresentation} from '../metricTabPresentation';

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
                isServerless: false,
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
                isServerless: false,
            }),
        ).toBe(tabletStorageStats);
    });

    test('keeps serverless legacy priority for tablet storage', () => {
        const blobStorageStats = [
            {
                name: EType.SSD,
                used: 500,
                limit: 1_000,
                usage: 50,
            },
        ];
        const tabletStorageStats = [
            {
                name: EType.SSD,
                used: 100,
                limit: undefined,
                usage: undefined,
            },
        ];

        expect(
            selectStorageStatsForMetricCard({
                blobStorageStats,
                tabletStorageStats,
                isServerless: true,
            }),
        ).toBe(tabletStorageStats);
    });
});

describe('metric tab presentation', () => {
    test('shows N/A when percent cannot be calculated', () => {
        expect(getMetricTabPresentation({usagePercent: NaN})).toEqual({
            percentText: 'N/A',
            status: EFlag.Grey,
        });

        expect(getUsageMetricTabPresentation({value: 10, limit: 0})).toEqual({
            percentText: 'N/A',
            status: EFlag.Grey,
        });
    });
});
