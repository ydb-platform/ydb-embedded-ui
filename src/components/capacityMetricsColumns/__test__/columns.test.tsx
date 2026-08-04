import React from 'react';

import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {
    getCapacityAlertColumn,
    getNormalizedOccupancyColumn,
    getPDiskUsageColumn,
    getVDiskRawUsageColumn,
    getVDiskSlotUsageColumn,
} from '../columns';

type HeaderProps = {header: string; note: string};

function getHeaderProps(header: React.ReactNode) {
    expect(React.isValidElement(header)).toBe(true);
    return (header as React.ReactElement<HeaderProps>).props;
}

describe('capacityMetricsColumns', () => {
    test('wires exact denominator help into every capacity column header', () => {
        const columns = [
            {
                column: getPDiskUsageColumn(),
                header: 'PDisk Usage',
                note: 'Occupied shared-quota chunks divided by chunks available to all VDisks on the PDisk.',
            },
            {
                column: getVDiskSlotUsageColumn(),
                header: 'VDisk Slot Usage',
                note: 'VDisk allocated chunks relative to its slot hard limit at the yellow-move threshold.',
            },
            {
                column: getVDiskRawUsageColumn(),
                header: 'VDisk Raw Usage',
                note: 'VDisk allocated chunks relative to its raw fair-part quota.',
            },
            {
                column: getNormalizedOccupancyColumn(),
                header: 'Normalized Occupancy',
                note: 'Internal nonlinear occupancy in the 0..1 range; this value is not a percentage.',
            },
            {
                column: getCapacityAlertColumn(),
                header: 'Capacity Alert',
                note: 'Backend capacity alert enum, not a percentage derived in the UI.',
            },
        ];

        for (const {column, header, note} of columns) {
            expect(getHeaderProps(column.header)).toEqual({header, note});
        }
    });

    test.each([
        ['missing', undefined],
        ['null', null],
        ['empty', ''],
        ['whitespace-only', '   '],
    ])('renders %s capacity alerts as the empty-data placeholder', (_caseName, value) => {
        const column = getCapacityAlertColumn();
        const result = column.render?.({row: {CapacityAlert: value}} as never);

        expect(result).toBe(EMPTY_DATA_PLACEHOLDER);
    });

    test.each(['LIGHT_YELLOW', 'FUTURE_ALERT'])(
        'keeps non-empty capacity alert %s',
        (capacityAlert) => {
            const column = getCapacityAlertColumn();
            const result = column.render?.({row: {CapacityAlert: capacityAlert}} as never);

            expect(result).toBe(capacityAlert);
        },
    );
});
