import {isFullVDiskData} from '../helpers';

describe('isFullVDiskData', () => {
    test('returns false when the VDiskId property exists with an undefined value', () => {
        expect(isFullVDiskData({VDiskId: undefined})).toBe(false);
    });

    test('returns true when VDiskId has a value', () => {
        expect(isFullVDiskData({VDiskId: {GroupID: 1}})).toBe(true);
    });
});
