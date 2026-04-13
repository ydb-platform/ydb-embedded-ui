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
