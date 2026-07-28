import {isFullVDiskData} from '../helpers';

describe('isFullVDiskData', () => {
    test('returns true when the VDiskId property exists with an undefined value', () => {
        expect(isFullVDiskData({VDiskId: undefined})).toBe(true);
    });

    test('returns false when the VDiskId property is missing', () => {
        expect(isFullVDiskData({VSlotId: 1})).toBe(false);
    });
});
