import {formatPercent} from '../dataFormatters';

describe('formatPercent', () => {
    test('rounds displayed percent in percent scale', () => {
        expect(formatPercent(0.015, 0)).toBe('2%');
        expect(formatPercent(0.0123, 2)).toBe('1.23%');
        expect(formatPercent(0.04265, 2)).toBe('4.27%');
        expect(formatPercent(2.135, 0)).toBe('214%');
        expect(formatPercent(2.0035, 1)).toBe('200.4%');
        expect(formatPercent(-2.135, 0)).toBe('-214%');
    });

    test('does not format infinite values', () => {
        expect(formatPercent(Infinity)).toBe('');
        expect(formatPercent('-Infinity')).toBe('');
    });
});
