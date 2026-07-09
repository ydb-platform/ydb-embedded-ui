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
                {id: NODES_COLUMNS_IDS.DiskSpaceUsage, selected: true},
                {id: NODES_COLUMNS_IDS.PDiskUsage, selected: true},
                {id: NODES_COLUMNS_IDS.VDiskSlotUsage, selected: true},
                {id: NODES_COLUMNS_IDS.VDiskRawUsage, selected: true},
                {id: NODES_COLUMNS_IDS.CapacityAlert, selected: true},
            ],
            setSavedColumns,
        ]);
    });

    test('hides capacity metrics and keeps legacy disk usage when experiment is disabled', () => {
        const {result} = renderHook(() => useStorageNodesSelectedColumns({visibleEntities: 'all'}));
        const selectableIds = result.current.columnsToSelect.map(({id}) => id);
        const visibleColumnNames = result.current.columnsToShow.map(({name}) => name);

        expect(selectableIds).not.toContain(NODES_COLUMNS_IDS.PDiskUsage);
        expect(selectableIds).not.toContain(NODES_COLUMNS_IDS.VDiskSlotUsage);
        expect(selectableIds).not.toContain(NODES_COLUMNS_IDS.VDiskRawUsage);
        expect(selectableIds).not.toContain(NODES_COLUMNS_IDS.CapacityAlert);
        expect(visibleColumnNames).toContain(NODES_COLUMNS_IDS.DiskSpaceUsage);
    });

    test('shows capacity metrics and hides legacy disk usage when experiment is enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        const {result} = renderHook(() => useStorageNodesSelectedColumns({visibleEntities: 'all'}));
        const selectableIds = result.current.columnsToSelect.map(({id}) => id);
        const visibleColumnNames = result.current.columnsToShow.map(({name}) => name);

        expect(selectableIds).not.toContain(NODES_COLUMNS_IDS.DiskSpaceUsage);
        expect(visibleColumnNames).not.toContain(NODES_COLUMNS_IDS.DiskSpaceUsage);
        expect(selectableIds).toEqual(
            expect.arrayContaining([
                NODES_COLUMNS_IDS.PDiskUsage,
                NODES_COLUMNS_IDS.VDiskSlotUsage,
                NODES_COLUMNS_IDS.VDiskRawUsage,
                NODES_COLUMNS_IDS.CapacityAlert,
            ]),
        );
        expect(visibleColumnNames).toEqual(
            expect.arrayContaining([
                NODES_COLUMNS_IDS.PDiskUsage,
                NODES_COLUMNS_IDS.VDiskSlotUsage,
                NODES_COLUMNS_IDS.VDiskRawUsage,
                NODES_COLUMNS_IDS.CapacityAlert,
            ]),
        );
    });

    test('does not add VDisk raw usage to default visible columns', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);
        useSetting.mockImplementation((_key: string, defaultValue: unknown) => [
            defaultValue,
            setSavedColumns,
        ]);

        const {result} = renderHook(() => useStorageNodesSelectedColumns({visibleEntities: 'all'}));
        const visibleColumnNames = result.current.columnsToShow.map(({name}) => name);

        expect(visibleColumnNames).not.toContain(NODES_COLUMNS_IDS.VDiskRawUsage);
        expect(visibleColumnNames).toEqual([
            NODES_COLUMNS_IDS.NodeId,
            NODES_COLUMNS_IDS.Host,
            NODES_COLUMNS_IDS.Uptime,
            NODES_COLUMNS_IDS.CPU,
            NODES_COLUMNS_IDS.RAM,
            NODES_COLUMNS_IDS.PDisks,
        ]);
    });
});
