import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../constants';
import {
    formatMetricBytes,
    formatMetricPercent,
    getConsistentMetricBytesSize,
} from '../storageMetrics';

describe('storageMetrics', () => {
    test('getConsistentMetricBytesSize chooses a shared unit from the largest metric', () => {
        expect(getConsistentMetricBytesSize([521_000_000, 1_230_000_000, 410_000_000])).toBe('gb');
    });

    test('formatMetricBytes keeps related values in the provided shared unit', () => {
        expect(formatMetricBytes(521_000_000, 'gb')).toBe(`0.52${UNBREAKABLE_GAP}GB`);
    });

    test('formatMetricBytes supports custom precision for shared unit formatting', () => {
        expect(formatMetricBytes(521_000_000, 'gb', {gbDecimalPlacesBelowOne: 1})).toBe(
            `0.5${UNBREAKABLE_GAP}GB`,
        );
        expect(formatMetricBytes(123.4, 'b', {bytesDecimalPlaces: 0})).toBe(
            `123${UNBREAKABLE_GAP}B`,
        );
    });

    test('formatMetricBytes keeps default precision when coarse approximate rounding is disabled', () => {
        expect(formatMetricBytes(3_450_000_000_000, 'tb')).toBe(`3.45${UNBREAKABLE_GAP}TB`);
        expect(formatMetricBytes(521_000_000_000, 'tb')).toBe(`0.52${UNBREAKABLE_GAP}TB`);
    });

    test('formatMetricBytes supports coarse approximate rounding', () => {
        expect(formatMetricBytes(521_000_000_000, 'gb', {coarseApproximateRounding: true})).toBe(
            `521${UNBREAKABLE_GAP}GB`,
        );
        expect(formatMetricBytes(3_450_000_000_000, 'tb', {coarseApproximateRounding: true})).toBe(
            `3.5${UNBREAKABLE_GAP}TB`,
        );
        expect(formatMetricBytes(10_400_000_000_000, 'tb', {coarseApproximateRounding: true})).toBe(
            `10${UNBREAKABLE_GAP}TB`,
        );
    });

    test('formatMetricBytes can reject negative values', () => {
        expect(formatMetricBytes(-1, undefined, {allowNegative: false})).toBe(
            EMPTY_DATA_PLACEHOLDER,
        );
    });

    test('formatMetricPercent keeps integer usage values without decimals', () => {
        expect(formatMetricPercent(50)).toBe('50%');
    });

    test('formatMetricPercent keeps one decimal for non-integer values', () => {
        expect(formatMetricPercent(64.2)).toBe('64.2%');
    });

    test('formatMetricPercent returns placeholder for invalid values', () => {
        expect(formatMetricPercent(undefined)).toBe(EMPTY_DATA_PLACEHOLDER);
    });
});
