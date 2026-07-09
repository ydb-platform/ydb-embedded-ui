import {formatPercent} from '../dataFormatters';

describe('formatPercent', () => {
    test('rounds displayed percent in percent scale', () => {
        expect(formatPercent(0.015, 0)).toBe('2%');
        expect(formatPercent(0.0123, 2)).toBe('1.23%');
    });
});
