import {roundToSignificant} from '../dataFormatters';

describe('roundToSignificant', () => {
    it('should work with only value', () => {
        expect(roundToSignificant(123)).toBe(123);
        expect(roundToSignificant(123.123)).toBe(123);
        expect(roundToSignificant(12.123)).toBe(12);
        expect(roundToSignificant(1.123)).toBe(1);
        expect(roundToSignificant(0.123)).toBe(0);
        expect(roundToSignificant(0)).toBe(0);
    });
    it('should work with precision', () => {
        expect(roundToSignificant(123, 2)).toBe(123);
        expect(roundToSignificant(123.123, 2)).toBe(123);
        expect(roundToSignificant(12.123, 2)).toBe(12);
        expect(roundToSignificant(1.123, 2)).toBe(1.1);
        expect(roundToSignificant(0.123, 2)).toBe(0.12);
        expect(roundToSignificant(0.012, 2)).toBe(0.01);
        expect(roundToSignificant(0.001, 2)).toBe(0);
        expect(roundToSignificant(0, 2)).toBe(0);
    });
});
