import {renderHook} from '@testing-library/react';

import {VDisksGroupBy} from '../../../../../utils/disks/groupBy';
import type {VDisksGroupByValue} from '../../../../../utils/disks/groupBy';
import {VDISKS_CONTAINER_WIDTH, getAllVDisksContainerWidth} from '../../../Disks/constants';
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
    useVDisksGroupByParam: jest.fn(),
}));

const {useBlobStorageCapacityMetricsEnabled, useBridgeModeEnabled} = jest.requireMock(
    '../../../../../store/reducers/capabilities/hooks',
);
const {useIsUserAllowedToMakeChanges, useIsViewerUser} = jest.requireMock(
    '../../../../../utils/hooks/useIsUserAllowedToMakeChanges',
);
const {useSetting} = jest.requireMock('../../../../../utils/hooks/useSetting');
const {useIsStorageExpertMode, useVDisksGroupByParam} = jest.requireMock(
    '../../../useStorageQueryParams',
);

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
    const getSavedColumns = (combinedDisksSelected = false) => [
        {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
        {id: STORAGE_GROUPS_COLUMNS_IDS.PoolName, selected: true},
        {id: STORAGE_GROUPS_COLUMNS_IDS.Erasure, selected: true},
        {id: STORAGE_GROUPS_COLUMNS_IDS.Used, selected: true},
        {id: STORAGE_GROUPS_COLUMNS_IDS.VDisks, selected: true},
        {
            id: STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
            selected: combinedDisksSelected,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        useBridgeModeEnabled.mockReturnValue(false);
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
        useIsUserAllowedToMakeChanges.mockReturnValue(true);
        useIsViewerUser.mockReturnValue(true);
        useIsStorageExpertMode.mockReturnValue(false);
        useVDisksGroupByParam.mockReturnValue(VDisksGroupBy.State);
        useSetting.mockReturnValue([getSavedColumns(), setSavedColumns]);
    });

    test('keeps VDisks and leaves VDisks with PDisks optional outside expert mode', () => {
        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        expect(
            result.current.columnsToSelect.find(
                ({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
            ),
        ).toEqual(
            expect.objectContaining({
                selected: false,
                required: false,
                sticky: undefined,
            }),
        );
        expect(result.current.columnsToShow.map(({name}) => name)).toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisks,
        );
        expect(result.current.columnsToShow.map(({name}) => name)).not.toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        );
    });

    test('requires VDisks with PDisks and removes VDisks in expert mode', () => {
        useIsStorageExpertMode.mockReturnValue(true);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        const vDisksPDisksColumn = result.current.columnsToSelect.find(
            ({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        );

        expect(vDisksPDisksColumn).toEqual(
            expect.objectContaining({
                selected: true,
                required: true,
                sticky: undefined,
                title: 'VDisks with PDisks',
            }),
        );
        expect(
            result.current.columnsToSelect.some(({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.VDisks),
        ).toBe(false);
        expect(result.current.columnsToShow.map(({name}) => name)).toEqual([
            STORAGE_GROUPS_COLUMNS_IDS.GroupId,
            STORAGE_GROUPS_COLUMNS_IDS.PoolName,
            STORAGE_GROUPS_COLUMNS_IDS.Erasure,
            STORAGE_GROUPS_COLUMNS_IDS.Used,
            STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        ]);
    });

    test('expands VDisks with PDisks only for Expert All mode', () => {
        const getDisksColumnWidth = (isExpertMode: boolean, vdisksGroupBy: VDisksGroupByValue) => {
            useIsStorageExpertMode.mockReturnValue(isExpertMode);
            useVDisksGroupByParam.mockReturnValue(vdisksGroupBy);
            useSetting.mockReturnValue([getSavedColumns(true), setSavedColumns]);

            const {result, unmount} = renderHook(() =>
                useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
            );
            const width = result.current.columnsToShow.find(
                ({name}) => name === STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
            )?.width;

            unmount();

            return width;
        };

        const ordinaryWidth = getDisksColumnWidth(false, VDisksGroupBy.State);
        if (ordinaryWidth === undefined) {
            throw new Error('VDisks with PDisks column must have a width');
        }

        expect(getDisksColumnWidth(false, VDisksGroupBy.All)).toBe(ordinaryWidth);
        expect(getDisksColumnWidth(true, VDisksGroupBy.State)).toBe(ordinaryWidth);
        expect(getDisksColumnWidth(true, VDisksGroupBy.All)).toBe(
            ordinaryWidth + getAllVDisksContainerWidth() - VDISKS_CONTAINER_WIDTH,
        );
    });

    test('replaces VDisks when saved columns select VDisks with PDisks in expert mode', () => {
        useIsStorageExpertMode.mockReturnValue(true);
        useSetting.mockReturnValue([
            [
                {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.PoolName, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Erasure, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Used, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.VDisks, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks, selected: true},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        expect(
            result.current.columnsToSelect.some(({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.VDisks),
        ).toBe(false);
        expect(
            result.current.columnsToSelect.find(
                ({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
            ),
        ).toEqual(
            expect.objectContaining({
                selected: true,
                required: true,
                sticky: undefined,
            }),
        );
        expect(result.current.columnsToShow.map(({name}) => name)).toEqual([
            STORAGE_GROUPS_COLUMNS_IDS.GroupId,
            STORAGE_GROUPS_COLUMNS_IDS.PoolName,
            STORAGE_GROUPS_COLUMNS_IDS.Erasure,
            STORAGE_GROUPS_COLUMNS_IDS.Used,
            STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        ]);
    });

    test('requires VDisks with PDisks when both disks columns were disabled', () => {
        useIsStorageExpertMode.mockReturnValue(true);
        useSetting.mockReturnValue([
            [
                {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.PoolName, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Erasure, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Used, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.VDisks, selected: false},
                {id: STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks, selected: false},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        expect(
            result.current.columnsToSelect.some(({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.VDisks),
        ).toBe(false);
        expect(result.current.columnsToShow.map(({name}) => name)).not.toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisks,
        );
        expect(result.current.columnsToShow.map(({name}) => name)).toContain(
            STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        );
        expect(
            result.current.columnsToSelect.find(
                ({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
            ),
        ).toEqual(
            expect.objectContaining({
                selected: true,
                required: true,
                sticky: undefined,
            }),
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

    test('hides selected legacy capacity columns without rewriting the saved setting when enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);
        useSetting.mockReturnValue([
            [
                {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Usage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpace, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage, selected: true},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );
        const legacyColumnIds: string[] = [
            STORAGE_GROUPS_COLUMNS_IDS.Usage,
            STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage,
            STORAGE_GROUPS_COLUMNS_IDS.DiskSpace,
        ];

        expect(
            result.current.columnsToSelect
                .map(({id}) => id)
                .filter((id) => legacyColumnIds.includes(id)),
        ).toEqual([]);
        expect(
            result.current.columnsToShow
                .map(({name}) => name)
                .filter((id) => legacyColumnIds.includes(id)),
        ).toEqual([]);
        expect(result.current.columnsToShow.map(({name}) => name)).toContain(
            STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage,
        );
        expect(setSavedColumns).not.toHaveBeenCalled();
    });

    test('preserves hidden legacy selections when saving enabled capacity columns', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);
        useSetting.mockReturnValue([
            [
                {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Usage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.PoolName, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpace, selected: false},
                {id: STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskSlotUsage, selected: true},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        result.current.setColumns(result.current.columnsToSelect);

        const trackedIds: string[] = [
            STORAGE_GROUPS_COLUMNS_IDS.GroupId,
            STORAGE_GROUPS_COLUMNS_IDS.Usage,
            STORAGE_GROUPS_COLUMNS_IDS.PoolName,
            STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage,
            STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage,
            STORAGE_GROUPS_COLUMNS_IDS.DiskSpace,
            STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskSlotUsage,
        ];
        const savedColumns = setSavedColumns.mock.calls[0][0] as Array<{
            id: string;
            selected: boolean;
        }>;

        expect(savedColumns.filter(({id}) => trackedIds.includes(id))).toEqual([
            {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.Usage, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.PoolName, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpace, selected: false},
            {id: STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskSlotUsage, selected: true},
        ]);
    });

    test('preserves hidden capacity selections when saving legacy columns', () => {
        useSetting.mockReturnValue([
            [
                {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Usage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskSlotUsage, selected: false},
                {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskRawUsage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpace, selected: false},
                {id: STORAGE_GROUPS_COLUMNS_IDS.MaxNormalizedOccupancy, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.CapacityAlert, selected: false},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        expect(result.current.columnsToSelect.map(({id}) => id)).not.toEqual(
            expect.arrayContaining([
                STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage,
                STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskSlotUsage,
            ]),
        );

        result.current.setColumns(result.current.columnsToSelect);

        const trackedIds: string[] = [
            STORAGE_GROUPS_COLUMNS_IDS.GroupId,
            STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage,
            STORAGE_GROUPS_COLUMNS_IDS.Usage,
            STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskSlotUsage,
            STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage,
            STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskRawUsage,
            STORAGE_GROUPS_COLUMNS_IDS.DiskSpace,
            STORAGE_GROUPS_COLUMNS_IDS.MaxNormalizedOccupancy,
            STORAGE_GROUPS_COLUMNS_IDS.CapacityAlert,
        ];
        const savedColumns = setSavedColumns.mock.calls[0][0] as Array<{
            id: string;
            selected: boolean;
        }>;

        expect(savedColumns.filter(({id}) => trackedIds.includes(id))).toEqual([
            {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.Usage, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskSlotUsage, selected: false},
            {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskRawUsage, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpace, selected: false},
            {id: STORAGE_GROUPS_COLUMNS_IDS.MaxNormalizedOccupancy, selected: true},
            {id: STORAGE_GROUPS_COLUMNS_IDS.CapacityAlert, selected: false},
        ]);
    });

    test('does not restore Space as a sticky column in the space view when enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'space'}),
        );

        expect(
            result.current.columnsToSelect.some(
                ({id}) => id === STORAGE_GROUPS_COLUMNS_IDS.DiskSpace,
            ),
        ).toBe(false);
        expect(
            result.current.columnsToShow.some(
                ({name}) => name === STORAGE_GROUPS_COLUMNS_IDS.DiskSpace,
            ),
        ).toBe(false);
    });

    test('keeps selected legacy capacity columns when the experiment is disabled or unsupported', () => {
        useSetting.mockReturnValue([
            [
                {id: STORAGE_GROUPS_COLUMNS_IDS.GroupId, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.Usage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage, selected: true},
                {id: STORAGE_GROUPS_COLUMNS_IDS.DiskSpace, selected: true},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useStorageGroupsSelectedColumns({visibleEntities: 'all'}),
        );

        expect(result.current.columnsToShow.map(({name}) => name)).toEqual(
            expect.arrayContaining([
                STORAGE_GROUPS_COLUMNS_IDS.Usage,
                STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage,
                STORAGE_GROUPS_COLUMNS_IDS.DiskSpace,
            ]),
        );
    });
});
