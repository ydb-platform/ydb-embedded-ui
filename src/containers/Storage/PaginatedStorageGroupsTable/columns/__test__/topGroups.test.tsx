import React from 'react';

import {render, screen, within} from '@testing-library/react';

import type {PreparedStorageGroup} from '../../../../../store/reducers/storage/types';
import {EFlag} from '../../../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {getTopGroupsTableConfig} from '../../../../Tenant/Diagnostics/TenantOverview/TenantStorage/TopGroups';

const requiredGroupFields: PreparedStorageGroup = {
    Degraded: 0,
    DiskSpace: EFlag.Grey,
    Limit: 0,
    Read: 0,
    Used: 0,
    Write: 0,
};

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

    test('renders zero Group Size In Units and a placeholder when it is missing', () => {
        const groupSizeColumn = getTopGroupsTableConfig(true).columns.find(
            ({name}) => name === 'GroupSizeInUnits',
        );

        expect(groupSizeColumn).toBeDefined();

        render(
            <React.Fragment>
                <div data-testid="zero-value">
                    {groupSizeColumn?.render({row: {...requiredGroupFields, GroupSizeInUnits: 0}})}
                </div>
                <div data-testid="missing-value">
                    {groupSizeColumn?.render({row: requiredGroupFields})}
                </div>
            </React.Fragment>,
        );

        expect(within(screen.getByTestId('zero-value')).getByText('0')).toBeVisible();
        expect(
            within(screen.getByTestId('missing-value')).getByText(EMPTY_DATA_PLACEHOLDER),
        ).toBeVisible();
    });

    test('renders VDisk Slot Usage in a danger Label for an orange capacity alert', () => {
        const vdiskSlotUsageColumn = getTopGroupsTableConfig(true).columns.find(
            ({name}) => name === 'MaxVDiskSlotUsage',
        );

        expect(vdiskSlotUsageColumn).toBeDefined();

        render(
            <div data-testid="vdisk-slot-usage">
                {vdiskSlotUsageColumn?.render({
                    row: {
                        ...requiredGroupFields,
                        CapacityAlert: 'ORANGE',
                        MaxVDiskSlotUsage: 0.75,
                    },
                })}
            </div>,
        );

        const percentage = screen.getByText('75.00%');
        expect(percentage).toBeVisible();
        expect(percentage.closest('.g-label_theme_danger')).not.toBeNull();
    });
});
