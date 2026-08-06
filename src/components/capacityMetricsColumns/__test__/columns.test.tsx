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
    test('wires exact help text into every capacity column header', () => {
        const columns = [
            {
                column: getPDiskUsageColumn(),
                header: 'PDisk Usage',
                note: 'Share of PDisk space used by VDisks. System and log reserves are not included.',
            },
            {
                column: getVDiskSlotUsageColumn(),
                header: 'VDisk Slot Usage',
                note: 'Percentage of VDisk space used relative to the first low-space warning. Can exceed 100%.',
            },
            {
                column: getVDiskRawUsageColumn(),
                header: 'VDisk Raw Usage',
                note: 'Percentage of VDisk space used relative to its fair share on the PDisk. Can exceed 100%.',
            },
            {
                column: getNormalizedOccupancyColumn(),
                header: 'Normalized Occupancy',
                note: 'Internal score used for gently handling low-space cases.',
            },
            {
                column: getCapacityAlertColumn(),
                header: 'Capacity Alert',
                note: 'Named status used for gently handling low-space cases.',
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
