import type {EDecommitStatus, EDriveStatus, EMaintenanceStatus} from '../../types/api/pdisk';
import {TPDiskState} from '../../types/api/pdisk';

import {
    getPDiskDecommitLabel,
    getPDiskDriveLabel,
    getPDiskMaintenanceLabel,
    getPDiskStateLabel,
} from './statuses';

describe('PDisk status labels', () => {
    test.each([undefined, null, '', 'FUTURE_STATUS'])(
        'shows Unknown only for State when the value is %p',
        (status) => {
            expect(getPDiskStateLabel(status as TPDiskState)).toMatchObject({
                value: 'Unknown',
                theme: 'unknown',
            });
            expect(getPDiskDriveLabel(status as EDriveStatus)).toBeUndefined();
            expect(getPDiskDecommitLabel(status as EDecommitStatus)).toBeUndefined();
            expect(getPDiskMaintenanceLabel(status as EMaintenanceStatus)).toBeUndefined();
        },
    );

    test('hides unknown controller statuses', () => {
        expect(getPDiskDriveLabel('UNKNOWN')).toBeUndefined();
        expect(getPDiskDecommitLabel('DECOMMIT_UNSET')).toBeUndefined();
    });

    test('keeps statuses explicitly defined by the backend contract', () => {
        expect(getPDiskStateLabel(TPDiskState.Normal)?.value).toBe('Ok');
        expect(getPDiskStateLabel(TPDiskState.Unknown)?.value).toBe('Unknown');
        expect(getPDiskDriveLabel('ACTIVE')?.value).toBe('Active');
        expect(getPDiskDecommitLabel('DECOMMIT_NONE')?.value).toBe('No decommission');
        expect(getPDiskMaintenanceLabel('NOT_SET')?.value).toBe('Unset');
    });
});
