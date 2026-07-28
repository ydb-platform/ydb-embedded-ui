import {getStorageNodesGroupByOptions} from '../constants';

describe('getStorageNodesGroupByOptions', () => {
    test('keeps legacy disk usage group-by and hides capacity alert when experiment is disabled', () => {
        const optionValues = getStorageNodesGroupByOptions(false).map(({value}) => value);

        expect(optionValues).toContain('DiskSpaceUsage');
        expect(optionValues).not.toContain('CapacityAlert');
    });

    test('keeps capacity alert group-by and hides legacy disk usage when experiment is enabled', () => {
        const optionValues = getStorageNodesGroupByOptions(true).map(({value}) => value);

        expect(optionValues).toContain('CapacityAlert');
        expect(optionValues).not.toContain('DiskSpaceUsage');
    });
});
