import {renderHook} from '@testing-library/react';

import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {
    getStorageGroupByCleanupPatch,
    useIsStorageExpertMode,
    useStorageQueryParams,
} from '../useStorageQueryParams';

jest.mock('use-query-params', () => ({
    BooleanParam: {},
    StringParam: {},
    useQueryParam: jest.fn(),
    useQueryParams: jest.fn(),
}));

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useBlobStorageCapacityMetricsAvailable: jest.fn(),
    useBlobStorageCapacityMetricsEnabled: jest.fn(),
}));

jest.mock('../../../utils/hooks', () => ({
    useSetting: jest.fn(),
}));

jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsUserAllowedToMakeChanges: jest.fn(),
}));

const {useQueryParam, useQueryParams} = jest.requireMock('use-query-params');
const {useBlobStorageCapacityMetricsAvailable} = jest.requireMock(
    '../../../store/reducers/capabilities/hooks',
);
const {useBlobStorageCapacityMetricsEnabled} = jest.requireMock(
    '../../../store/reducers/capabilities/hooks',
);
const {useSetting} = jest.requireMock('../../../utils/hooks');
const {useIsUserAllowedToMakeChanges} = jest.requireMock(
    '../../../utils/hooks/useIsUserAllowedToMakeChanges',
);

describe('getStorageGroupByCleanupPatch', () => {
    test('clears legacy group-by values when blob metrics are enabled', () => {
        expect(
            getStorageGroupByCleanupPatch({
                blobMetricsEnabled: true,
                storageGroupsGroupBy: 'Usage',
                storageNodesGroupBy: 'DiskSpaceUsage',
            }),
        ).toStrictEqual({
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
        ).toStrictEqual({});
    });

    test('clears legacy disk usage group-by for groups when blob metrics are enabled', () => {
        expect(
            getStorageGroupByCleanupPatch({
                blobMetricsEnabled: true,
                storageGroupsGroupBy: 'DiskSpaceUsage',
            }),
        ).toStrictEqual({storageGroupsGroupBy: undefined});
    });

    test('clears capacity alert group-by values when blob metrics are disabled', () => {
        expect(
            getStorageGroupByCleanupPatch({
                blobMetricsEnabled: false,
                storageGroupsGroupBy: 'CapacityAlert',
                storageNodesGroupBy: 'CapacityAlert',
            }),
        ).toStrictEqual({
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
        ).toStrictEqual({});
    });
});

describe('PDisk expert mode query params', () => {
    test('normalizes an invalid PDisk mode to State', () => {
        const constants = jest.requireActual('../StorageExpertModePanel/constants');

        expect(constants.pdisksGroupBySchema?.parse('Unknown')).toBe('State');
    });

    test('reads and persists the selected PDisk mode', () => {
        const setQueryParams = jest.fn();
        const setSavedPDisksGroupBy = jest.fn();

        useQueryParams.mockReturnValue([{pdisksGroupBy: 'Space'}, setQueryParams]);
        useSetting.mockImplementation((key: string) => {
            if (key === 'storagePDisksGroupBy') {
                return ['State', setSavedPDisksGroupBy];
            }

            return [undefined, jest.fn()];
        });
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        const {result} = renderHook(() => useStorageQueryParams());
        const pDiskState = result.current as unknown as {
            pdisksGroupBy?: string;
            handlePDisksGroupByChange?: (value: string) => void;
        };

        expect(pDiskState.pdisksGroupBy).toBe('Space');
        expect(pDiskState.handlePDisksGroupByChange).toBeDefined();

        pDiskState.handlePDisksGroupByChange?.('Device');

        expect(setQueryParams).toHaveBeenCalledWith({pdisksGroupBy: 'Device'}, 'replaceIn');
        expect(setSavedPDisksGroupBy).toHaveBeenCalledWith('Device');
    });
});

describe('useIsStorageExpertMode', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        useQueryParam.mockReturnValue([true]);
        useSetting.mockImplementation((key: string) => [
            key === SETTING_KEYS.ENABLE_STORAGE_EXPERT_MODE ||
                key === SETTING_KEYS.STORAGE_EXPERT_MODE,
        ]);
        useIsUserAllowedToMakeChanges.mockReturnValue(true);
    });

    test.each([
        {available: false, expected: false},
        {available: true, expected: true},
    ])(
        'returns $expected when requested mode availability is $available',
        ({available, expected}) => {
            useBlobStorageCapacityMetricsAvailable.mockReturnValue(available);

            const {result} = renderHook(() => useIsStorageExpertMode());

            expect(result.current).toBe(expected);
        },
    );

    test.each([
        {source: 'query parameter', queryValue: true, savedValue: false},
        {source: 'saved setting', queryValue: undefined, savedValue: true},
    ])('returns false for unauthorized users with $source state', ({queryValue, savedValue}) => {
        useBlobStorageCapacityMetricsAvailable.mockReturnValue(true);
        useQueryParam.mockReturnValue([queryValue]);
        useSetting.mockImplementation((key: string) => [
            key === SETTING_KEYS.ENABLE_STORAGE_EXPERT_MODE ||
                (key === SETTING_KEYS.STORAGE_EXPERT_MODE && savedValue),
        ]);
        useIsUserAllowedToMakeChanges.mockReturnValue(false);

        const {result} = renderHook(() => useIsStorageExpertMode());

        expect(result.current).toBe(false);
    });
});
