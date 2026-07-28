import {UNBREAKABLE_GAP} from '../../constants';
import {formatNetworkMetric, formatStorageLegend} from '../formatMetricLegend';

describe('formatMetricLegend', () => {
    test('formatStorageLegend uses metric byte precision for shared units', () => {
        expect(
            formatStorageLegend({
                value: 521_000_000_000,
                capacity: 6_000_000_000_000,
            }),
        ).toBe(`0.52 of 6${UNBREAKABLE_GAP}TB`);
        expect(
            formatStorageLegend({
                value: 3_450_000_000_000,
                capacity: 6_000_000_000_000,
            }),
        ).toBe(`3.45 of 6${UNBREAKABLE_GAP}TB`);
    });

    test('formatStorageLegend uses mixed units when values differ by threshold', () => {
        expect(
            formatStorageLegend({
                value: 1_000_000,
                capacity: 36_000_000_000_000,
            }),
        ).toBe(`1${UNBREAKABLE_GAP}MB of 36${UNBREAKABLE_GAP}TB`);
    });

    test('formatStorageLegend does not add trailing zeros to integer values', () => {
        expect(
            formatStorageLegend({
                value: 1_000_000_000,
                capacity: 2_000_000_000,
            }),
        ).toBe(`1 of 2${UNBREAKABLE_GAP}GB`);
        expect(
            formatStorageLegend({
                value: 10_000_000,
                capacity: 20_000_000,
            }),
        ).toBe(`10 of 20${UNBREAKABLE_GAP}MB`);
        expect(
            formatStorageLegend({
                value: 3_000_000_000_000,
                capacity: 6_000_000_000_000,
            }),
        ).toBe(`3 of 6${UNBREAKABLE_GAP}TB`);
    });

    test('formatStorageLegend keeps value label when capacity is invalid', () => {
        expect(
            formatStorageLegend({
                value: 2_000,
                capacity: Number.NaN,
            }),
        ).toBe(`2${UNBREAKABLE_GAP}KB of `);
    });

    test('formatNetworkMetric uses metric byte precision', () => {
        expect(formatNetworkMetric(189_000)).toBe(`189${UNBREAKABLE_GAP}KB/s`);
        expect(formatNetworkMetric(521_000_000)).toBe(`521${UNBREAKABLE_GAP}MB/s`);
        expect(formatNetworkMetric(999_600_000)).toBe(`1${UNBREAKABLE_GAP}GB/s`);
        expect(formatNetworkMetric(1_230_000_000)).toBe(`1.2${UNBREAKABLE_GAP}GB/s`);
        expect(formatNetworkMetric(521_000_000_000)).toBe(`521${UNBREAKABLE_GAP}GB/s`);
        expect(formatNetworkMetric(999_960_000_000)).toBe(`1${UNBREAKABLE_GAP}TB/s`);
        expect(formatNetworkMetric(3_450_000_000_000)).toBe(`3.45${UNBREAKABLE_GAP}TB/s`);
        expect(formatNetworkMetric(undefined)).toBe('');
    });
});
