import {renderHook} from '@testing-library/react';

import {STORAGE_GROUPS_COLUMNS_IDS} from '../constants';
import {useStorageGroupsSelectedColumns} from '../hooks';

jest.mock('../../../../../store/reducers/capabilities/hooks', () => ({
    useBlobStorageCapacityMetricsEnabled: jest.fn(),
    useBridgeModeEnabled: jest.fn(),
}));

jest.mock('../../../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsUserAllowedToMakeChanges: jest.fn(),
    useIsViewerUser: jest.fn(),
}));

jest.mock('../../../../../utils/hooks/useSetting', () => ({
    useSetting: jest.fn(),
}));

jest.mock('../../../useStorageQueryParams', () => ({
    useIsStorageExpertMode: jest.fn(),
}));

const {useBlobStorageCapacityMetricsEnabled, useBridgeModeEnabled} = jest.requireMock(
    '../../../../../store/reducers/capabilities/hooks',
);
const {useIsUserAllowedToMakeChanges, useIsViewerUser} = jest.requireMock(
    '../../../../../utils/hooks/useIsUserAllowedToMakeChanges',
);
const {useSetting} = jest.requireMock('../../../../../utils/hooks/useSetting');
const {useIsStorageExpertMode} = jest.requireMock('../../../useStorageQueryParams');

if (!Array.prototype.toSorted) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, 'toSorted', {
        value<T>(this: T[], compareFn?: (a: T, b: T) => number) {
            return [...this].sort(compareFn);
        },
    });
}

describe('useStorageGroupsSelectedColumns', () => {
    const setSavedColumns = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        useBridgeModeEnabled.mockReturnValue(false);
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
        useIsUserAllowedToMakeChanges.mockReturnValue(true);
        useIsViewerUser.mockReturnValue(true);
        useIsStorageExpertMode.mockReturnValue(false);
        useSetting.mockReturnValue([
            [
                {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.PoolName, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Erasure, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Used, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.VDisks, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks, selected: false},
            ],
            setSavedColumns,
        ]);
    });

    test('forces VDisks with PDisks when saved columns enable expert mode with regular VDisks', () => {
        useIsStorageExpertMode.mockReturnValue(true);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        expect(
            result.current.columnsToSelect.some(({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.VDisks),
        ).toBe(false);

        const vDisksPDisksColumn = result.current.columnsToSelect.find(
            ({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        );

        expect(vDisksPDisksColumn).toEqual(
            expect.objectContaining({
                selected: true,
                required: true,
            }),
        );
        expect(result.current.columnsToShow.map(({name}) => name)).toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        );
        expect(result.current.columnsToShow.map(({name}) => name)).not.toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisks,
        );
    });

    test('adds VDisks with PDisks to defaults when columns are not configured in expert mode', () => {
        useIsStorageExpertMode.mockReturnValue(true);
        useSetting.mockImplementation((_key: string, defaultValue: unknown) => [
            defaultValue,
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        expect(result.current.columnsToShow.map(({name}) => name)).toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        );
        expect(result.current.columnsToShow.map(({name}) => name)).not.toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisks,
        );
    });

    test('keeps VDisks column in expert mode when VDisks with PDisks is unavailable', () => {
        useIsStorageExpertMode.mockReturnValue(true);
        useIsUserAllowedToMakeChanges.mockReturnValue(false);
        useIsViewerUser.mockReturnValue(true);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        expect(result.current.columnsToShow.map(({name}) => name)).toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisks,
        );
        expect(result.current.columnsToShow.map(({name}) => name)).not.toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        );
    });
});
