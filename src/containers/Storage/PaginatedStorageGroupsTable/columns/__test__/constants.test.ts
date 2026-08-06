import {getRequiredDataFields} from '../../../../../utils/tableUtils/getRequiredDataFields';
import {
    GROUPS_COLUMNS_TO_DATA_FIELDS,
    STORAGE_GROUPS_COLUMNS_IDS,
    getStorageGroupsColumnSortField,
    getStorageGroupsGroupByOptions,
} from '../constants';

describe('storage groups capacity column contracts', () => {
    test('switches legacy and capacity group-by options atomically with the experiment', () => {
        const enabledOptionValues = getStorageGroupsGroupByOptions(true, true).map(
            ({value}) => value,
        );
        const disabledOptionValues = getStorageGroupsGroupByOptions(false, true).map(
            ({value}) => value,
        );

        expect(enabledOptionValues).toEqual(expect.arrayContaining(['PileName', 'CapacityAlert']));
        expect(enabledOptionValues).not.toContain('Usage');
        expect(enabledOptionValues).not.toContain('DiskSpaceUsage');
        expect(disabledOptionValues).toEqual(
            expect.arrayContaining(['PileName', 'Usage', 'DiskSpaceUsage']),
        );
        expect(disabledOptionValues).not.toContain('CapacityAlert');
    });

    test('hides Pile Name group-by when bridge mode is disabled', () => {
        const optionValues = getStorageGroupsGroupByOptions(true, false).map(({value}) => value);

        expect(optionValues).not.toContain('PileName');
    });

    test.each([
        [STORAGE_GROUPS_COLUMNS_IDS.MaxPDiskUsage, 'MaxPDiskUsage', ['MaxPDiskUsage']],
        [
            STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskSlotUsage,
            'MaxVDiskSlotUsage',
            ['CapacityAlert', 'MaxVDiskSlotUsage'],
        ],
        [STORAGE_GROUPS_COLUMNS_IDS.MaxVDiskRawUsage, 'MaxVDiskRawUsage', ['MaxVDiskRawUsage']],
        [
            STORAGE_GROUPS_COLUMNS_IDS.MaxNormalizedOccupancy,
            'MaxNormalizedOccupancy',
            ['MaxNormalizedOccupancy'],
        ],
        [STORAGE_GROUPS_COLUMNS_IDS.CapacityAlert, 'CapacityAlert', ['CapacityAlert']],
    ])(
        'maps %s to sort %s and its exact request fields',
        (columnId, expectedSortField, expectedDataFields) => {
            expect(getStorageGroupsColumnSortField(columnId)).toBe(expectedSortField);
            expect(getRequiredDataFields([columnId], GROUPS_COLUMNS_TO_DATA_FIELDS)).toEqual(
                expectedDataFields,
            );
        },
    );
});
