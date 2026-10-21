import {getRequiredDataFields} from '../../../utils/tableUtils/getRequiredDataFields';
import {
    NODES_COLUMNS_IDS,
    NODES_COLUMNS_TO_DATA_FIELDS,
    getNodesColumnSortField,
} from '../constants';

describe('storage nodes capacity column contracts', () => {
    test('requests capacity alert when VDisk Slot Usage is selected without its alert column', () => {
        const requiredFields = getRequiredDataFields(
            [NODES_COLUMNS_IDS.NodeId, NODES_COLUMNS_IDS.VDiskSlotUsage],
            NODES_COLUMNS_TO_DATA_FIELDS,
        );

        expect(requiredFields).toEqual(['CapacityAlert', 'MaxVDiskSlotUsage', 'NodeId']);
    });

    test.each([
        [NODES_COLUMNS_IDS.PDiskUsage, 'MaxPDiskUsage'],
        [NODES_COLUMNS_IDS.VDiskSlotUsage, 'MaxVDiskSlotUsage'],
        [NODES_COLUMNS_IDS.VDiskRawUsage, 'MaxVDiskRawUsage'],
        [NODES_COLUMNS_IDS.CapacityAlert, 'CapacityAlert'],
    ])('sorts %s by %s', (columnId, expectedSortField) => {
        expect(getNodesColumnSortField(columnId)).toBe(expectedSortField);
    });
});

test('requests only basic memory when RAM is selected', () => {
    expect(getRequiredDataFields([NODES_COLUMNS_IDS.RAM], NODES_COLUMNS_TO_DATA_FIELDS)).toEqual([
        'Memory',
    ]);
});

test('requests usage and system limit alongside the detailed breakdown', () => {
    expect(getRequiredDataFields([NODES_COLUMNS_IDS.Memory], NODES_COLUMNS_TO_DATA_FIELDS)).toEqual(
        ['Memory', 'MemoryDetailed'],
    );
});
