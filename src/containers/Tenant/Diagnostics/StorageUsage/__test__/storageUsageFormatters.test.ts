import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../../../../utils/constants';
import {
    formatMetricBytes,
    formatOverhead,
    getConsistentMetricBytesSize,
} from '../storageUsageFormatters';

describe('storageUsageFormatters', () => {
    test('formatMetricBytes keeps integer precision for megabytes', () => {
        expect(formatMetricBytes(521_000_000)).toBe(`521${UNBREAKABLE_GAP}MB`);
    });

    test('formatMetricBytes keeps automatic size selection by default', () => {
        expect(formatMetricBytes(1_230_000_000)).toBe(`1.2${UNBREAKABLE_GAP}GB`);
    });

    test('getConsistentMetricBytesSize chooses common size from the largest value', () => {
        expect(getConsistentMetricBytesSize([521_000_000, 1_230_000_000])).toBe('gb');
    });

    test('formatMetricBytes supports explicit shared size for related values', () => {
        expect(formatMetricBytes(521_000_000, 'gb')).toBe(`0.52${UNBREAKABLE_GAP}GB`);
    });

    test('formatOverhead keeps integer values without decimal part', () => {
        expect(formatOverhead(400, 50)).toBe('8x');
    });

    test('formatOverhead shows one decimal place for non-integer values', () => {
        expect(formatOverhead(425, 50)).toBe('8.5x');
    });

    test('formatOverhead returns placeholder for invalid data size', () => {
        expect(formatOverhead(100, 0)).toBe(EMPTY_DATA_PLACEHOLDER);
    });
});
