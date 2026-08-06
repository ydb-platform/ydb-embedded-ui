import type {PreparedVDisk} from '../../../../utils/disks/types';
import {calculateCompactVDiskWidths} from '../calculateCompactVDiskWidths';

const disks = (...sizes: Array<number | undefined>): PreparedVDisk[] =>
    sizes.map((AllocatedSize) => ({AllocatedSize}));

describe('calculateCompactVDiskWidths', () => {
    test('distributes compact space equally for equal allocations', () => {
        expect(calculateCompactVDiskWidths(disks(1, 1, 1), 4)).toEqual([308 / 3, 308 / 3, 308 / 3]);
    });

    test('preserves the compact minimum and redistributes the remainder', () => {
        expect(calculateCompactVDiskWidths(disks(1, 99), 4)).toEqual([24, 288]);
    });

    test('uses the average compact width when allocation is unavailable', () => {
        expect(calculateCompactVDiskWidths(disks(undefined, 99), 4)).toEqual([156, 156]);
    });

    test('uses equal fallback weights for zero and negative allocations', () => {
        expect(calculateCompactVDiskWidths(disks(0, -1), 4)).toEqual([156, 156]);
    });

    test('returns no widths for an empty row', () => {
        expect(calculateCompactVDiskWidths([], 4)).toEqual([]);
    });
});
