import React from 'react';

import {render, screen, within} from '@testing-library/react';

import type {PreparedStorageGroup} from '../../../store/reducers/storage/types';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {
    getCapacityAlertColumn,
    getNormalizedOccupancyColumn,
    getPDiskUsageColumn,
    getVDiskRawUsageColumn,
    getVDiskSlotUsageColumn,
} from '../columns';
import {CAPACITY_METRICS_HELP_TEXT} from '../constants';

describe('capacityMetricsColumns', () => {
    test('defines exact denominator help for every capacity metric', () => {
        expect(CAPACITY_METRICS_HELP_TEXT).toEqual({
            MaxPDiskUsage:
                'Occupied shared-quota chunks divided by chunks available to all VDisks on the PDisk.',
            MaxVDiskSlotUsage:
                'VDisk allocated chunks relative to its slot hard limit at the yellow-move threshold.',
            MaxVDiskRawUsage: 'VDisk allocated chunks relative to its raw fair-part quota.',
            MaxNormalizedOccupancy:
                'Internal nonlinear occupancy in the 0..1 range; this value is not a percentage.',
            CapacityAlert: 'Backend capacity alert enum, not a percentage derived in the UI.',
        });
    });

    test('renders help marks in all capacity metric headers', () => {
        render(
            <React.Fragment>
                {[
                    getPDiskUsageColumn<PreparedStorageGroup>(),
                    getVDiskSlotUsageColumn<PreparedStorageGroup>(),
                    getVDiskRawUsageColumn<PreparedStorageGroup>(),
                    getNormalizedOccupancyColumn<PreparedStorageGroup>(),
                    getCapacityAlertColumn<PreparedStorageGroup>(),
                ].map(({name, header}) => (
                    <div key={name}>{header}</div>
                ))}
            </React.Fragment>,
        );

        expect(document.querySelectorAll('.g-help-mark')).toHaveLength(5);
    });

    test('renders invalid normalized occupancy as missing while preserving zero', () => {
        const column = getNormalizedOccupancyColumn<{
            MaxNormalizedOccupancy?: number;
        }>();

        render(
            <React.Fragment>
                <div data-testid="negative-value">
                    {column.render({row: {MaxNormalizedOccupancy: -1}})}
                </div>
                <div data-testid="zero-value">
                    {column.render({row: {MaxNormalizedOccupancy: 0}})}
                </div>
            </React.Fragment>,
        );

        expect(
            within(screen.getByTestId('negative-value')).getByText(EMPTY_DATA_PLACEHOLDER),
        ).toBeVisible();
        expect(within(screen.getByTestId('zero-value')).getByText('0.00')).toBeVisible();
    });
});
