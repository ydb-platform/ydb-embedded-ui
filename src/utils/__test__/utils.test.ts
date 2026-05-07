import {parseNonNegativeNumber, parseOptionalNonNegativeNumber} from '../utils';

describe('parseOptionalNonNegativeNumber', () => {
    test('returns non-negative finite numbers', () => {
        expect(parseOptionalNonNegativeNumber(0)).toBe(0);
        expect(parseOptionalNonNegativeNumber('42')).toBe(42);
        expect(parseOptionalNonNegativeNumber('')).toBe(0);
    });

    test('returns undefined for invalid or negative values', () => {
        expect(parseOptionalNonNegativeNumber(undefined)).toBeUndefined();
        expect(parseOptionalNonNegativeNumber('abc')).toBeUndefined();
        expect(parseOptionalNonNegativeNumber(-1)).toBeUndefined();
        expect(parseOptionalNonNegativeNumber(Infinity)).toBeUndefined();
    });

    test('can treat empty strings as undefined', () => {
        expect(parseOptionalNonNegativeNumber('', {emptyStringAsUndefined: true})).toBeUndefined();
        expect(
            parseOptionalNonNegativeNumber('   ', {emptyStringAsUndefined: true}),
        ).toBeUndefined();
    });
});

describe('parseNonNegativeNumber', () => {
    test('returns fallback for invalid or negative values', () => {
        expect(parseNonNegativeNumber(undefined)).toBe(0);
        expect(parseNonNegativeNumber('abc')).toBe(0);
        expect(parseNonNegativeNumber(-1, 10)).toBe(10);
    });
});
