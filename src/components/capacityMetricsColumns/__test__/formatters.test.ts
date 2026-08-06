import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {formatCapacityUnitCount} from '../formatters';

describe('capacity unit formatters', () => {
    test.each([
        ['absent', undefined],
        ['numeric zero', 0],
    ])('formats %s capacity units as an implicit single unit', (_caseName, value) => {
        expect(formatCapacityUnitCount(value)).toBe('1 (implicit)');
    });

    test.each([
        [1, '1'],
        [2, '2'],
    ])('keeps explicit capacity unit value %s', (value, expected) => {
        expect(formatCapacityUnitCount(value)).toBe(expected);
    });

    test.each([
        ['null', null],
        ['empty', ''],
        ['whitespace-only', '   '],
        ['negative', -1],
        ['NaN', Number.NaN],
        ['nonnumeric', 'invalid'],
    ])('formats %s capacity units as the empty-data placeholder', (_caseName, value) => {
        expect(formatCapacityUnitCount(value)).toBe(EMPTY_DATA_PLACEHOLDER);
    });
});
