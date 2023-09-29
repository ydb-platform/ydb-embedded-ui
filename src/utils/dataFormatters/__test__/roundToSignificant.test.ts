import {roundToPrecision} from '../dataFormatters';

describe('roundToSignificant', () => {
    it('should work with only value', () => {
        expect(roundToPrecision(123)).toBe(123);
        expect(roundToPrecision(123.123)).toBe(123);
        expect(roundToPrecision(12.123)).toBe(12);
        expect(roundToPrecision(1.123)).toBe(1);
        expect(roundToPrecision(0.123)).toBe(0);
        expect(roundToPrecision(0)).toBe(0);
    });
    it('should work with precision', () => {
        expect(roundToPrecision(123, 2)).toBe(123);
        expect(roundToPrecision(123.123, 2)).toBe(123);
        expect(roundToPrecision(12.123, 2)).toBe(12);
        expect(roundToPrecision(1.123, 2)).toBe(1.1);
        expect(roundToPrecision(0.123, 2)).toBe(0.12);
        expect(roundToPrecision(0.012, 2)).toBe(0.01);
        expect(roundToPrecision(0.001, 2)).toBe(0);
        expect(roundToPrecision(0, 2)).toBe(0);
    });
});
