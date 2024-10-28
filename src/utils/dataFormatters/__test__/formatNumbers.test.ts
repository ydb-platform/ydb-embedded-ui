import {UNBREAKABLE_GAP} from '../../utils';
import {formatNumericValues} from '../dataFormatters';

describe('formatNumericValues', () => {
    it('should return ["", ""] when both value and total are undefined', () => {
        const result = formatNumericValues();
        expect(result).toEqual(['', '']);
    });

    it('should format value correctly when total is undefined', () => {
        const result = formatNumericValues(1000);
        expect(result).toEqual([`1${UNBREAKABLE_GAP}k`, '']);
    });

    it('should format total correctly when value is undefined', () => {
        const result = formatNumericValues(undefined, 1_000_000);
        expect(result).toEqual(['', `1${UNBREAKABLE_GAP}m`]);
    });

    it('should format both value and total correctly', () => {
        const result = formatNumericValues(1024, 2048);
        expect(result).toEqual(['1', `2${UNBREAKABLE_GAP}k`]);
    });
    it('should format value with label if set', () => {
        const result = formatNumericValues(1024, 2048, undefined, undefined, true);
        expect(result).toEqual([`1${UNBREAKABLE_GAP}k`, `2${UNBREAKABLE_GAP}k`]);
    });

    it('should return ["0", formattedTotal] when value is 0', () => {
        const result = formatNumericValues(0, 2048);
        expect(result).toEqual(['0', `2${UNBREAKABLE_GAP}k`]);
    });

    it('should use provided size and delimiter', () => {
        const result = formatNumericValues(5120, 10240, 'billion', '/');
        expect(result).toEqual(['0', '0/b']);
    });

    it('should handle non-numeric total gracefully', () => {
        const result = formatNumericValues(2048, 'Not a number' as any);
        expect(result).toEqual([`2${UNBREAKABLE_GAP}k`, '']);
    });
});
