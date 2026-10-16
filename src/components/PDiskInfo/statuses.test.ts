import {CircleQuestionFill} from '@gravity-ui/icons';

import type {EDecommitStatus, EDriveStatus, EMaintenanceStatus} from '../../types/api/pdisk';
import {TPDiskState} from '../../types/api/pdisk';

import {
    getPDiskDecommitLabel,
    getPDiskDriveLabel,
    getPDiskMaintenanceLabel,
    getPDiskStateLabel,
} from './statuses';

describe('PDisk status labels', () => {
    test.each([undefined, null, ''])(
        'labels missing controller statuses when the value is %p',
        (status) => {
            expect(getPDiskStateLabel(status as TPDiskState)).toMatchObject({
                value: 'Unknown',
                theme: 'unknown',
            });
            for (const [title, tooltip, label] of [
                [
                    'Drive status',
                    'Drive is not available',
                    getPDiskDriveLabel(status as EDriveStatus),
                ],
                [
                    'Decomission',
                    'Decomission status is not available',
                    getPDiskDecommitLabel(status as EDecommitStatus),
                ],
                [
                    'Maintenance',
                    'Maintenance status is not available',
                    getPDiskMaintenanceLabel(status as EMaintenanceStatus),
                ],
            ]) {
                expect(label).toMatchObject({
                    title,
                    value: 'N/A',
                    tooltip,
                    theme: 'unknown',
                    icon: CircleQuestionFill,
                });
            }
        },
    );

    test('labels known unavailable statuses and hides unsupported statuses', () => {
        expect(getPDiskStateLabel('FUTURE_STATUS' as TPDiskState)?.value).toBe('Unknown');
        expect(getPDiskDriveLabel('FUTURE_STATUS' as EDriveStatus)).toBeUndefined();
        expect(getPDiskDecommitLabel('FUTURE_STATUS' as EDecommitStatus)).toBeUndefined();
        expect(getPDiskMaintenanceLabel('FUTURE_STATUS' as EMaintenanceStatus)).toBeUndefined();
        expect(getPDiskDriveLabel('UNKNOWN')).toMatchObject({
            title: 'Drive status',
            value: 'N/A',
            tooltip: 'Drive is not available',
            theme: 'unknown',
            icon: CircleQuestionFill,
        });
        expect(getPDiskDecommitLabel('DECOMMIT_UNSET')).toMatchObject({
            title: 'Decomission',
            value: 'N/A',
            tooltip: 'Decomission status is not available',
            theme: 'unknown',
            icon: CircleQuestionFill,
        });
    });

    test('keeps statuses explicitly defined by the backend contract', () => {
        expect(getPDiskStateLabel(TPDiskState.Normal)?.value).toBe('Ok');
        expect(getPDiskStateLabel(TPDiskState.Unknown)?.value).toBe('Unknown');
        expect(getPDiskDriveLabel('ACTIVE')?.value).toBe('Active');
        expect(getPDiskDecommitLabel('DECOMMIT_NONE')?.value).toBe('No decommission');
        expect(getPDiskMaintenanceLabel('NOT_SET')?.value).toBe('Unset');
    });
});
