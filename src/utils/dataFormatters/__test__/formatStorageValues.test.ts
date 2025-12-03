import {UNBREAKABLE_GAP} from '../../constants';
import {formatStorageValues} from '../dataFormatters';

describe('formatStorageValues', () => {
    test('should return ["", ""] when both value and total are undefined', () => {
        const result = formatStorageValues();
        expect(result).toEqual(['', '']);
    });

    test('should format value correctly when total is undefined', () => {
        const result = formatStorageValues(1024);
        expect(result).toEqual([`1${UNBREAKABLE_GAP}KB`, '']);
    });

    test('should format total correctly when value is undefined', () => {
        const result = formatStorageValues(undefined, 2048);
        expect(result).toEqual(['', `2${UNBREAKABLE_GAP}KB`]);
    });

    test('should format both value and total correctly', () => {
        const result = formatStorageValues(1024, 2048);
        expect(result).toEqual(['1', `2${UNBREAKABLE_GAP}KB`]);
    });

    test('should return ["0", formattedTotal] when value is 0', () => {
        const result = formatStorageValues(0, 2048);
        expect(result).toEqual(['0', `2${UNBREAKABLE_GAP}KB`]);
    });

    test('should use provided size and delimiter', () => {
        const result = formatStorageValues(5120, 10240, 'mb', '/');
        expect(result).toEqual(['0', '0/MB']);
    });

    test('should handle non-numeric total gracefully', () => {
        const result = formatStorageValues(2048, 'Not a number' as any);
        expect(result).toEqual([`2${UNBREAKABLE_GAP}KB`, '']);
    });
});
