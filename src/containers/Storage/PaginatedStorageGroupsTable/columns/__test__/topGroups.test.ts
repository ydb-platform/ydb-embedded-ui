import {getTopGroupsTableConfig} from '../../../../Tenant/Diagnostics/TenantOverview/TenantStorage/TopGroups';

describe('Top Groups capacity metrics', () => {
    test('keeps the legacy table contract while capacity metrics are disabled', () => {
        expect(getTopGroupsTableConfig(false)).toEqual(
            expect.objectContaining({
                sort: '-Usage',
                fieldsRequired: [
                    'Encryption',
                    'Erasure',
                    'GroupId',
                    'Limit',
                    'MediaType',
                    'Usage',
                    'Used',
                ],
            }),
        );
        expect(getTopGroupsTableConfig(false).columns.map(({name}) => name)).toEqual([
            'GroupId',
            'MediaType',
            'Erasure',
            'Usage',
            'Used',
            'Limit',
        ]);
    });

    test('uses capacity metrics fields, columns and sorting when enabled', () => {
        expect(getTopGroupsTableConfig(true)).toEqual(
            expect.objectContaining({
                sort: '-MaxVDiskSlotUsage',
                fieldsRequired: [
                    'CapacityAlert',
                    'Encryption',
                    'Erasure',
                    'GroupId',
                    'GroupSizeInUnits',
                    'Limit',
                    'MaxVDiskSlotUsage',
                    'MediaType',
                    'Used',
                ],
            }),
        );
        expect(getTopGroupsTableConfig(true).columns.map(({name}) => name)).toEqual([
            'GroupId',
            'MediaType',
            'Erasure',
            'MaxVDiskSlotUsage',
            'GroupSizeInUnits',
            'Used',
            'Limit',
        ]);
    });
});
