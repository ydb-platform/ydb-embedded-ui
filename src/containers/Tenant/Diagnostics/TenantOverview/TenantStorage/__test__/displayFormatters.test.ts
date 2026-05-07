import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../../../../../utils/constants';
import {
    formatSummaryPercent,
    formatTenantStorageAdaptiveMetric,
    formatTenantStorageApproximateMetric,
    formatTenantStorageSummaryMetric,
    formatTenantStorageTableMetric,
    formatTenantStorageTableOverhead,
    getTenantStorageLegendValueFormatter,
    getTenantStorageSegmentValueFormatters,
    getTenantStorageSummaryMetricUnit,
} from '../displayFormatters';
import type {TenantStorageSegment} from '../utils';
import {TENANT_STORAGE_SEGMENT_KEYS, getTenantStorageSegmentDisplayValue} from '../utils';

const withUnit = (value: string, unit: string) => `${value}${UNBREAKABLE_GAP}${unit}`;
const GB = 1_000_000_000;
const TB = 1_000_000_000_000;
const PB = 1_000_000_000_000_000;

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

    test('formats summary petabyte values without redundant decimal zeros', () => {
        expect(formatTenantStorageSummaryMetric(1_200_000_000_000_000, 'pb')).toBe(
            withUnit('1.2', 'PB'),
        );
        expect(formatTenantStorageSummaryMetric(3_450_000_000_000_000, 'pb')).toBe(
            withUnit('3.45', 'PB'),
        );
        expect(formatTenantStorageSummaryMetric(18_000_000_000_000_000, 'pb')).toBe(
            withUnit('18', 'PB'),
        );
        expect(formatTenantStorageSummaryMetric(306_400_000_000_000_000, 'pb')).toBe(
            withUnit('306.4', 'PB'),
        );
    });

    test('selects summary units by PB, TB, GB, MB priority', () => {
        expect(getTenantStorageSummaryMetricUnit([1.2 * PB, 300 * TB, 900 * TB])).toBe('pb');
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
        expect(getTenantStorageSummaryMetricUnit([500_000, undefined])).toBe('mb');
    });

    test('keeps summary values in the requested unit', () => {
        expect(formatTenantStorageSummaryMetric(600_000_000_000, 'tb')).toBe(withUnit('0.6', 'TB'));
    });

    test('formats summary used percent with one decimal below one percent', () => {
        expect(formatSummaryPercent(0)).toBe('');
        expect(formatSummaryPercent(0.5)).toBe('used 0.5%');
        expect(formatSummaryPercent(23.4)).toBe('used 23%');
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

    test('selects legend units from displayed segment values', () => {
        const segments: TenantStorageSegment[] = [
            {
                key: TENANT_STORAGE_SEGMENT_KEYS.rowTables,
                value: 1.8 * TB,
                displayValue: 118 * GB,
                progressValue: 2.56 * TB,
            },
            {
                key: TENANT_STORAGE_SEGMENT_KEYS.columnTables,
                value: 0.65 * TB,
                displayValue: GB,
                progressValue: 1.135 * TB,
            },
            {
                key: TENANT_STORAGE_SEGMENT_KEYS.topics,
                value: 0.65 * TB,
                displayValue: GB,
                progressValue: 1.135 * TB,
            },
        ];
        const displayValues = segments.map(getTenantStorageSegmentDisplayValue);
        const formatValue = getTenantStorageLegendValueFormatter(displayValues);

        expect(formatValue(displayValues[0])).toBe(withUnit('118', 'GB'));
        expect(formatValue(displayValues[1])).toBe(withUnit('1', 'GB'));
        expect(formatValue(displayValues[2])).toBe(withUnit('1', 'GB'));
    });

    test('formats segment tooltip values one unit below the common legend unit', () => {
        const gbFormatters = getTenantStorageSegmentValueFormatters([
            600_000_000_000, 900_000_000_000,
        ]);
        const mbFormatters = getTenantStorageSegmentValueFormatters([3_000_000, 5_000_000]);

        expect(gbFormatters.formatLegendValue(600_000_000_000)).toBe(withUnit('600', 'GB'));
        expect(gbFormatters.formatTooltipValue(600_000_000_000)).toBe(
            withUnit(['600', '000'].join(UNBREAKABLE_GAP), 'MB'),
        );
        expect(mbFormatters.formatLegendValue(3_000_000)).toBe(withUnit('3', 'MB'));
        expect(mbFormatters.formatTooltipValue(3_000_000)).toBe(
            withUnit(['3', '000'].join(UNBREAKABLE_GAP), 'KB'),
        );
    });

    test('formats mixed-unit segment tooltips one unit below each adaptive legend unit', () => {
        const formatters = getTenantStorageSegmentValueFormatters([
            70_000_000_000, 21_000_000_000_000,
        ]);

        expect(formatters.formatLegendValue(21_000_000_000_000)).toBe(withUnit('21', 'TB'));
        expect(formatters.formatTooltipValue(21_000_000_000_000)).toBe(
            withUnit(['21', '000'].join(UNBREAKABLE_GAP), 'GB'),
        );
        expect(formatters.formatLegendValue(70_000_000_000)).toBe(withUnit('70', 'GB'));
        expect(formatters.formatTooltipValue(70_000_000_000)).toBe(
            withUnit(['70', '000'].join(UNBREAKABLE_GAP), 'MB'),
        );
    });

    test('keeps bytes as the lowest segment tooltip unit', () => {
        const formatters = getTenantStorageSegmentValueFormatters([500_000, 800_000]);

        expect(formatters.formatLegendValue(500_000)).toBe(withUnit('500', 'KB'));
        expect(formatters.formatTooltipValue(500_000)).toBe(
            withUnit(['500', '000'].join(UNBREAKABLE_GAP), 'B'),
        );
        expect(formatters.formatTooltipValue(undefined)).toBe(EMPTY_DATA_PLACEHOLDER);
    });
});
