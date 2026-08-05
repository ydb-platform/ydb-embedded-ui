import {renderHook} from '@testing-library/react';

import {NODES_COLUMNS_IDS} from '../../../../../components/nodesColumns/constants';
import {useStorageNodesSelectedColumns} from '../hooks';

jest.mock('../../../../../store/reducers/capabilities/hooks', () => ({
    useBlobStorageCapacityMetricsEnabled: jest.fn(),
    useBridgeModeEnabled: jest.fn(),
}));

jest.mock('../../../../../utils/hooks/useSetting', () => ({
    useSetting: jest.fn(),
}));

const {useBlobStorageCapacityMetricsEnabled, useBridgeModeEnabled} = jest.requireMock(
    '../../../../../store/reducers/capabilities/hooks',
);
const {useSetting} = jest.requireMock('../../../../../utils/hooks/useSetting');

if (!Array.prototype.toSorted) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, 'toSorted', {
        value<T>(this: T[], compareFn?: (a: T, b: T) => number) {
            return [...this].sort(compareFn);
        },
    });
}

describe('useStorageNodesSelectedColumns', () => {
    const setSavedColumns = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        useBridgeModeEnabled.mockReturnValue(false);
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
        useSetting.mockReturnValue([
            [
                {id: NODES_COLUMNS_IDS.NodeId, selected: true},
                {id: NODES_COLUMNS_IDS.PDisks, selected: true},
                {id: NODES_COLUMNS_IDS.DiskSpaceUsage, selected: true},
                {id: NODES_COLUMNS_IDS.PDiskUsage, selected: true},
                {id: NODES_COLUMNS_IDS.VDiskSlotUsage, selected: true},
                {id: NODES_COLUMNS_IDS.VDiskRawUsage, selected: true},
                {id: NODES_COLUMNS_IDS.CapacityAlert, selected: true},
            ],
            setSavedColumns,
        ]);
    });

    test('replaces legacy disk usage with explicit capacity columns when enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        const {result} = renderHook(() => useStorageNodesSelectedColumns({visibleEntities: 'all'}));
        const selectableColumnIds = result.current.columnsToSelect.map(({id}) => id);

        expect(selectableColumnIds).not.toContain(NODES_COLUMNS_IDS.DiskSpaceUsage);
        expect(selectableColumnIds).toEqual(
            expect.arrayContaining([
                NODES_COLUMNS_IDS.PDiskUsage,
                NODES_COLUMNS_IDS.VDiskSlotUsage,
                NODES_COLUMNS_IDS.VDiskRawUsage,
                NODES_COLUMNS_IDS.CapacityAlert,
            ]),
        );
        expect(result.current.columnsToShow.map(({name}) => name)).toContain(
            NODES_COLUMNS_IDS.VDiskRawUsage,
        );
    });

    test('keeps legacy disk usage and hides explicit capacity columns when disabled', () => {
        const {result} = renderHook(() => useStorageNodesSelectedColumns({visibleEntities: 'all'}));
        const selectableColumnIds = result.current.columnsToSelect.map(({id}) => id);

        expect(selectableColumnIds).toContain(NODES_COLUMNS_IDS.DiskSpaceUsage);
        for (const capacityColumnId of [
            NODES_COLUMNS_IDS.PDiskUsage,
            NODES_COLUMNS_IDS.VDiskSlotUsage,
            NODES_COLUMNS_IDS.VDiskRawUsage,
            NODES_COLUMNS_IDS.CapacityAlert,
        ]) {
            expect(selectableColumnIds).not.toContain(capacityColumnId);
        }
        expect(result.current.columnsToShow.map(({name}) => name)).toContain(
            NODES_COLUMNS_IDS.DiskSpaceUsage,
        );
    });

    test('preserves hidden legacy selection when saving enabled capacity columns', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);
        useSetting.mockReturnValue([
            [
                {id: NODES_COLUMNS_IDS.NodeId, selected: true},
                {id: NODES_COLUMNS_IDS.DiskSpaceUsage, selected: true},
                {id: NODES_COLUMNS_IDS.PDisks, selected: true},
                {id: NODES_COLUMNS_IDS.PDiskUsage, selected: true},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() => useStorageNodesSelectedColumns({visibleEntities: 'all'}));

        result.current.setColumns(result.current.columnsToSelect);

        const trackedIds: string[] = [
            NODES_COLUMNS_IDS.NodeId,
            NODES_COLUMNS_IDS.DiskSpaceUsage,
            NODES_COLUMNS_IDS.PDisks,
            NODES_COLUMNS_IDS.PDiskUsage,
        ];
        const savedColumns = setSavedColumns.mock.calls[0][0] as Array<{
            id: string;
            selected: boolean;
        }>;

        expect(savedColumns.filter(({id}) => trackedIds.includes(id))).toEqual([
            {id: NODES_COLUMNS_IDS.NodeId, selected: true},
            {id: NODES_COLUMNS_IDS.DiskSpaceUsage, selected: true},
            {id: NODES_COLUMNS_IDS.PDisks, selected: true},
            {id: NODES_COLUMNS_IDS.PDiskUsage, selected: true},
        ]);
    });

    test('preserves hidden capacity selections when saving legacy columns', () => {
        useSetting.mockReturnValue([
            [
                {id: NODES_COLUMNS_IDS.NodeId, selected: true},
                {id: NODES_COLUMNS_IDS.PDiskUsage, selected: true},
                {id: NODES_COLUMNS_IDS.PDisks, selected: true},
                {id: NODES_COLUMNS_IDS.VDiskSlotUsage, selected: true},
                {id: NODES_COLUMNS_IDS.DiskSpaceUsage, selected: true},
                {id: NODES_COLUMNS_IDS.VDiskRawUsage, selected: true},
                {id: NODES_COLUMNS_IDS.CapacityAlert, selected: true},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() => useStorageNodesSelectedColumns({visibleEntities: 'all'}));

        result.current.setColumns(result.current.columnsToSelect);

        const trackedIds: string[] = [
            NODES_COLUMNS_IDS.NodeId,
            NODES_COLUMNS_IDS.PDiskUsage,
            NODES_COLUMNS_IDS.PDisks,
            NODES_COLUMNS_IDS.VDiskSlotUsage,
            NODES_COLUMNS_IDS.DiskSpaceUsage,
            NODES_COLUMNS_IDS.VDiskRawUsage,
            NODES_COLUMNS_IDS.CapacityAlert,
        ];
        const savedColumns = setSavedColumns.mock.calls[0][0] as Array<{
            id: string;
            selected: boolean;
        }>;

        expect(savedColumns.filter(({id}) => trackedIds.includes(id))).toEqual([
            {id: NODES_COLUMNS_IDS.NodeId, selected: true},
            {id: NODES_COLUMNS_IDS.PDiskUsage, selected: true},
            {id: NODES_COLUMNS_IDS.PDisks, selected: true},
            {id: NODES_COLUMNS_IDS.VDiskSlotUsage, selected: true},
            {id: NODES_COLUMNS_IDS.DiskSpaceUsage, selected: true},
            {id: NODES_COLUMNS_IDS.VDiskRawUsage, selected: true},
            {id: NODES_COLUMNS_IDS.CapacityAlert, selected: true},
        ]);
    });
});
