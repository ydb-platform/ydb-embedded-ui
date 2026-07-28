import {getStorageGroupByCleanupPatch} from '../useStorageQueryParams';

describe('getStorageGroupByCleanupPatch', () => {
    test('clears legacy group-by values when blob metrics are enabled', () => {
        expect(
            getStorageGroupByCleanupPatch({
                blobMetricsEnabled: true,
                storageGroupsGroupBy: 'Usage',
                storageNodesGroupBy: 'DiskSpaceUsage',
            }),
        ).toEqual({
            storageGroupsGroupBy: undefined,
            storageNodesGroupBy: undefined,
        });
    });

    test('keeps capacity alert group-by values when blob metrics are enabled', () => {
        expect(
            getStorageGroupByCleanupPatch({
                blobMetricsEnabled: true,
                storageGroupsGroupBy: 'CapacityAlert',
                storageNodesGroupBy: 'CapacityAlert',
            }),
        ).toEqual({});
    });

    test('clears capacity alert group-by values when blob metrics are disabled', () => {
        expect(
            getStorageGroupByCleanupPatch({
                blobMetricsEnabled: false,
                storageGroupsGroupBy: 'CapacityAlert',
                storageNodesGroupBy: 'CapacityAlert',
            }),
        ).toEqual({
            storageGroupsGroupBy: undefined,
            storageNodesGroupBy: undefined,
        });
    });

    test('keeps legacy node disk usage group-by when blob metrics are disabled', () => {
        expect(
            getStorageGroupByCleanupPatch({
                blobMetricsEnabled: false,
                storageNodesGroupBy: 'DiskSpaceUsage',
            }),
        ).toEqual({});
    });
});
