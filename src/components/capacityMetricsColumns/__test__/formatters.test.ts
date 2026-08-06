import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {formatCapacityUnitCount} from '../formatters';

describe('capacity unit formatters', () => {
    test.each([
        ['absent', undefined],
        ['numeric zero', 0],
    ])('formats %s capacity units as an implicit single unit', (_caseName, value) => {
        expect(formatCapacityUnitCount(value)).toBe('1 (implicit)');
    });

    test('keeps explicit capacity unit value 1', () => {
        expect(formatCapacityUnitCount(1)).toBe('1');
    });

    test.each([
        ['null', null],
        ['empty', ''],
        ['negative', -1],
        ['nonnumeric', 'invalid'],
    ])('formats %s capacity units as the empty-data placeholder', (_caseName, value) => {
        expect(formatCapacityUnitCount(value)).toBe(EMPTY_DATA_PLACEHOLDER);
    });
});
