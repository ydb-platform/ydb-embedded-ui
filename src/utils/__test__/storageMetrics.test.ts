import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../constants';
import {
    formatMetricBytes,
    formatMetricCount,
    formatMetricCountPair,
    formatMetricPercent,
    formatNormalizedMetricPercent,
    formatStorageMetricPair,
    getConsistentMetricBytesSize,
    getConvertedMetricBytesDecimalPlaces,
    getMetricBytesCommonSize,
    getMetricBytesDisplaySize,
} from '../storageMetrics';

describe('storageMetrics', () => {
    test('getConsistentMetricBytesSize chooses a shared unit from the largest metric', () => {
        expect(getConsistentMetricBytesSize([521_000_000, 1_230_000_000, 410_000_000])).toBe('gb');
    });

    test('getConsistentMetricBytesSize accounts for rounded display unit boundaries', () => {
        expect(getConsistentMetricBytesSize([200_000_000, 999_600_000])).toBe('gb');
        expect(getConsistentMetricBytesSize([200_000_000_000, 999_960_000_000])).toBe('tb');
    });

    test('getMetricBytesCommonSize keeps a shared unit below mixed-unit threshold', () => {
        expect(getMetricBytesCommonSize([600_000_000_000, 40_000_000_000_000])).toBe('tb');
    });

    test('getMetricBytesCommonSize returns no shared unit at mixed-unit threshold', () => {
        expect(getMetricBytesCommonSize([1_000_000_000, 100_000_000_000])).toBeUndefined();
    });

    test('getMetricBytesCommonSize ignores zero and invalid values for mixed-unit threshold', () => {
        expect(getMetricBytesCommonSize([0, Number.NaN, 36_000_000_000_000])).toBe('tb');
    });

    test('getMetricBytesDisplaySize accounts for rounded display unit boundaries', () => {
        expect(getMetricBytesDisplaySize(999_600_000)).toBe('gb');
        expect(getMetricBytesDisplaySize(999_960_000_000)).toBe('tb');
    });

    test('formatMetricBytes keeps related values in the provided shared unit', () => {
        expect(formatMetricBytes(521_000_000, 'gb')).toBe(`0.52${UNBREAKABLE_GAP}GB`);
    });

    test('formatMetricBytes rolls automatic size over when rounded value reaches the next unit', () => {
        expect(formatMetricBytes(999_600_000)).toBe(`1${UNBREAKABLE_GAP}GB`);
        expect(formatMetricBytes(999_960_000_000)).toBe(`1${UNBREAKABLE_GAP}TB`);
    });

    test('formatMetricBytes keeps explicit shared size at the requested unit boundary', () => {
        expect(formatMetricBytes(999_600_000, 'mb')).toBe(
            `1${UNBREAKABLE_GAP}000${UNBREAKABLE_GAP}MB`,
        );
    });

    test('formatMetricBytes supports custom precision for shared unit formatting', () => {
        expect(formatMetricBytes(521_000_000, 'gb', {gbDecimalPlacesBelowOne: 1})).toBe(
            `0.5${UNBREAKABLE_GAP}GB`,
        );
        expect(formatMetricBytes(123.4, 'b', {bytesDecimalPlaces: 0})).toBe(
            `123${UNBREAKABLE_GAP}B`,
        );
    });

    test('getConvertedMetricBytesDecimalPlaces returns precision for metric byte formatting', () => {
        expect(getConvertedMetricBytesDecimalPlaces('tb', 0.521)).toBe(2);
        expect(getConvertedMetricBytesDecimalPlaces('tb', 3.45)).toBe(2);
        expect(getConvertedMetricBytesDecimalPlaces('tb', 6)).toBe(2);
        expect(getConvertedMetricBytesDecimalPlaces('gb', 1.2)).toBe(1);
        expect(getConvertedMetricBytesDecimalPlaces('gb', 1)).toBe(0);
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
        expect(
            formatMetricBytes(1_700_000_000_000_000, 'pb', {coarseApproximateRounding: true}),
        ).toBe(`1.7${UNBREAKABLE_GAP}PB`);
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

    test.each([0, 0.0001, 0.004])('omits decimals when %s percent rounds to zero', (value) => {
        expect(formatMetricPercent(value, 2)).toBe('0%');
        expect(formatNormalizedMetricPercent(value / 100)).toBe('0%');
    });

    test('keeps fixed precision for non-zero storage percentages', () => {
        expect(formatMetricPercent(1, 2)).toBe('1.00%');
        expect(formatMetricPercent(0.005, 2)).toBe('0.01%');
        expect(formatNormalizedMetricPercent(0.01)).toBe('1.00%');
    });

    test('formats zero storage sizes without decimals in fixed-precision pairs', () => {
        expect(formatStorageMetricPair(0, 2_000_000_000, 2)).toBe(`0 / 2.00${UNBREAKABLE_GAP}GB`);
        expect(formatStorageMetricPair(1, 0, 2)).toBe(`0 / 0${UNBREAKABLE_GAP}GB`);
    });

    test('formatMetricPercent keeps one decimal for non-integer values', () => {
        expect(formatMetricPercent(64.2)).toBe('64.2%');
    });

    test('formatMetricPercent does not clamp usage values above 100', () => {
        expect(formatMetricPercent(123.4)).toBe('123.4%');
    });

    test('formatMetricPercent returns placeholder for invalid values', () => {
        expect(formatMetricPercent(undefined)).toBe(EMPTY_DATA_PLACEHOLDER);
        expect(formatMetricPercent(null)).toBe(EMPTY_DATA_PLACEHOLDER);
        expect(formatMetricPercent('')).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test('formatStorageMetricPair formats valid storage values in gigabytes', () => {
        expect(formatStorageMetricPair(1_000_000_000, 2_000_000_000)).toBe(
            `1 / 2${UNBREAKABLE_GAP}GB`,
        );
    });

    test.each([undefined, null, '', Number.NaN, Infinity, -1])(
        'keeps the known storage size when the other value is %s',
        (missing) => {
            const value = missing as number | string | undefined;
            expect(formatStorageMetricPair(value, 2_000_000_000)).toBe(`— / 2${UNBREAKABLE_GAP}GB`);
            expect(formatStorageMetricPair(1_000_000_000, value)).toBe(`1${UNBREAKABLE_GAP}GB / —`);
            expect(formatStorageMetricPair(value, 2_000_000_000, 2)).toBe(
                `— / 2.00${UNBREAKABLE_GAP}GB`,
            );
            expect(formatStorageMetricPair(1_000_000_000, value, 2)).toBe(
                `1.00${UNBREAKABLE_GAP}GB / —`,
            );
            expect(formatStorageMetricPair(value, value, 2)).toBe(EMPTY_DATA_PLACEHOLDER);
        },
    );

    test('keeps zero and legacy precision in a partial storage pair', () => {
        expect(formatStorageMetricPair(0, undefined, 2)).toBe(`0${UNBREAKABLE_GAP}GB / —`);
        expect(formatStorageMetricPair(undefined, 0, 2)).toBe(`— / 0${UNBREAKABLE_GAP}GB`);
        expect(formatStorageMetricPair(560_000_000, undefined)).toBe(`0.6${UNBREAKABLE_GAP}GB / —`);
    });

    test('formatNormalizedMetricPercent formats normalized values with fixed precision', () => {
        expect(formatNormalizedMetricPercent(0.8225)).toBe('82.25%');
    });

    test('formatNormalizedMetricPercent returns placeholder for missing values', () => {
        expect(formatNormalizedMetricPercent(undefined)).toBe(EMPTY_DATA_PLACEHOLDER);
        expect(formatNormalizedMetricPercent(null as unknown as number)).toBe(
            EMPTY_DATA_PLACEHOLDER,
        );
    });

    test('formatMetricCount preserves zero and rejects empty values', () => {
        expect(formatMetricCount(0)).toBe('0');
        expect(formatMetricCount(null)).toBe(EMPTY_DATA_PLACEHOLDER);
        expect(formatMetricCount('')).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test('formatMetricCountPair preserves a zero count', () => {
        expect(formatMetricCountPair(0, 4)).toBe('0 / 4');
    });

    test('formatMetricCountPair preserves each known count', () => {
        expect(formatMetricCountPair(null, 4)).toBe('— / 4');
        expect(formatMetricCountPair(0, null)).toBe('0 / —');
        expect(formatMetricCountPair(null, undefined)).toBe(EMPTY_DATA_PLACEHOLDER);
    });
});
