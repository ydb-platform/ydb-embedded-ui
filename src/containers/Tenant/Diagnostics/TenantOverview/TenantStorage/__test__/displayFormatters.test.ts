import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../../../../../utils/constants';
import {
    formatTenantStorageAdaptiveMetric,
    formatTenantStorageApproximateMetric,
    formatTenantStorageSummaryMetric,
    formatTenantStorageTableMetric,
    formatTenantStorageTableOverhead,
    formatTenantStorageTooltipMetric,
    getTenantStorageLegendValueFormatter,
    getTenantStorageSummaryMetricUnit,
} from '../displayFormatters';

const withUnit = (value: string, unit: string) => `${value}${UNBREAKABLE_GAP}${unit}`;

describe('TenantStorage display formatters', () => {
    test('formats summary terabyte values without redundant decimal zeros', () => {
        expect(formatTenantStorageSummaryMetric(21_000_000_000_000, 'tb')).toBe(
            withUnit('21', 'TB'),
        );
        expect(formatTenantStorageSummaryMetric(4_800_000_000_000, 'tb')).toBe(
            withUnit('4.8', 'TB'),
        );
        expect(formatTenantStorageSummaryMetric(3_450_000_000_000, 'tb')).toBe(
            withUnit('3.45', 'TB'),
        );
        expect(formatTenantStorageSummaryMetric(174_100_000_000_000, 'tb')).toBe(
            withUnit('174.1', 'TB'),
        );
        expect(formatTenantStorageSummaryMetric(201_000_000_000_000, 'tb')).toBe(
            withUnit('201', 'TB'),
        );
    });

    test('selects summary units by TB, GB, MB priority', () => {
        expect(
            getTenantStorageSummaryMetricUnit([
                18_000_000_000_000, 4_800_000_000_000, 21_000_000_000_000,
            ]),
        ).toBe('tb');
        expect(
            getTenantStorageSummaryMetricUnit([
                600_000_000_000, 250_000_000_000, 2_000_000_000_000,
            ]),
        ).toBe('tb');
        expect(
            getTenantStorageSummaryMetricUnit([600_000_000_000, 250_000_000_000, 900_000_000_000]),
        ).toBe('gb');
        expect(getTenantStorageSummaryMetricUnit([600_000_000, 250_000_000, 900_000_000])).toBe(
            'mb',
        );
    });

    test('keeps summary values in the requested unit', () => {
        expect(formatTenantStorageSummaryMetric(600_000_000_000, 'tb')).toBe(withUnit('0.6', 'TB'));
    });

    test('formats adaptive byte values with readable units', () => {
        expect(formatTenantStorageAdaptiveMetric(70_000_000_000)).toBe(withUnit('70', 'GB'));
        expect(formatTenantStorageAdaptiveMetric(432_000_000_000)).toBe(withUnit('432', 'GB'));
        expect(formatTenantStorageAdaptiveMetric(236_000_000_000)).toBe(withUnit('236', 'GB'));
        expect(formatTenantStorageAdaptiveMetric(1_200_000_000)).toBe(withUnit('1.2', 'GB'));
        expect(formatTenantStorageAdaptiveMetric(500_000_000)).toBe(withUnit('500', 'MB'));
    });

    test('formats top usage table metrics adaptively', () => {
        expect(formatTenantStorageTableMetric(35_600_000_000)).toBe(withUnit('35.6', 'GB'));
        expect(formatTenantStorageTableMetric(10_000_000)).toBe(withUnit('10', 'MB'));
        expect(formatTenantStorageTableMetric(500_000)).toBe(withUnit('500', 'KB'));
        expect(formatTenantStorageTableMetric(0)).toBe(withUnit('0', 'B'));
        expect(formatTenantStorageTableMetric(undefined)).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test('caps top usage table overhead above 500x', () => {
        expect(formatTenantStorageTableOverhead(2)).toBe('2x');
        expect(formatTenantStorageTableOverhead(4.7)).toBe('4.7x');
        expect(formatTenantStorageTableOverhead(500)).toBe('500x');
        expect(formatTenantStorageTableOverhead(513)).toBe('>500x');
    });

    test('formats approximate metrics with a readable lower unit when needed', () => {
        expect(formatTenantStorageApproximateMetric(18_000_000_000_000, 'tb')).toBe(
            `~${withUnit('18', 'TB')}`,
        );
        expect(formatTenantStorageApproximateMetric(4_800_000_000_000, 'tb')).toBe(
            `~${withUnit('4.8', 'TB')}`,
        );
        expect(formatTenantStorageApproximateMetric(600_000_000_000, 'tb')).toBe(
            `~${withUnit('600', 'GB')}`,
        );
        expect(formatTenantStorageApproximateMetric(undefined, 'tb')).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test('keeps legend values in a common unit below mixed-unit threshold', () => {
        const formatValue = getTenantStorageLegendValueFormatter([
            600_000_000_000, 40_000_000_000_000,
        ]);

        expect(formatValue(600_000_000_000)).toBe(withUnit('0.6', 'TB'));
        expect(formatValue(40_000_000_000_000)).toBe(withUnit('40', 'TB'));
    });

    test('uses adaptive legend units at mixed-unit threshold', () => {
        const formatValue = getTenantStorageLegendValueFormatter([
            70_000_000_000, 21_000_000_000_000,
        ]);

        expect(formatValue(70_000_000_000)).toBe(withUnit('70', 'GB'));
        expect(formatValue(21_000_000_000_000)).toBe(withUnit('21', 'TB'));
    });

    test('formats tooltip metric as exact bytes', () => {
        expect(formatTenantStorageTooltipMetric(3_123_456_789)).toBe(
            withUnit(['3', '123', '456', '789'].join(UNBREAKABLE_GAP), 'B'),
        );
    });
});
