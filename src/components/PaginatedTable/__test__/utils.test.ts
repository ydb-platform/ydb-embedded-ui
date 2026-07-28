import {isSortColumnAvailable} from '../utils';

describe('isSortColumnAvailable', () => {
    test('returns false when the active sort column is not available', () => {
        expect(
            isSortColumnAvailable({columnId: 'DiskSpaceUsage'}, [{name: 'NodeId'}, {name: 'Host'}]),
        ).toBe(false);
    });

    test('returns true when the active sort column is available or sorting is inactive', () => {
        const columns = [{name: 'NodeId'}, {name: 'DiskSpaceUsage'}];

        expect(isSortColumnAvailable({columnId: 'DiskSpaceUsage'}, columns)).toBe(true);
        expect(isSortColumnAvailable({}, columns)).toBe(true);
        expect(isSortColumnAvailable(undefined, columns)).toBe(true);
    });
});
