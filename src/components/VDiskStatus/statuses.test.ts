import {ArrowsRotateLeft, ArrowsRotateLeftSlash} from '@gravity-ui/icons';

import type {EVDiskDetailedReplicationStatus} from '../../types/api/vdisk';
import {EVDiskState} from '../../types/api/vdisk';

import {getVDiskReplicationLabel, getVDiskStateLabel} from './statuses';

describe('VDisk state label', () => {
    test.each([undefined, null, '', 'FutureState'])(
        'shows No data for a missing or unsupported %p',
        (state) => {
            expect(getVDiskStateLabel({VDiskState: state as EVDiskState})).toMatchObject({
                value: 'No data',
                theme: 'unknown',
            });
        },
    );

    test('keeps a supported state', () => {
        expect(getVDiskStateLabel({VDiskState: EVDiskState.OK})?.value).toBe('Ok');
        expect(getVDiskStateLabel({VDiskState: EVDiskState.PDiskError})?.value).toBe('PDisk Error');
    });
});

describe('VDisk replication label', () => {
    test('hides an unsupported detailed status without using the boolean fallback', () => {
        expect(
            getVDiskReplicationLabel({
                DetailedReplicationStatus: 'FutureReplication' as EVDiskDetailedReplicationStatus,
                Replicated: false,
            }),
        ).toBeUndefined();
    });

    test('uses the boolean fallback only when the detailed status is absent', () => {
        expect(getVDiskReplicationLabel({Replicated: false})).toMatchObject({
            value: 'Not replicated',
            theme: 'normal',
            icon: ArrowsRotateLeftSlash,
        });
        expect(getVDiskReplicationLabel({Replicated: true})?.value).toBe('Replicated');
        expect(getVDiskReplicationLabel({})).toBeUndefined();
    });

    test.each([
        {ReplicationProgress: 0},
        {ReplicationProgress: 0.77},
        {ReplicationProgress: 1},
        {ReplicationSecondsRemaining: 0},
        {ReplicationSecondsRemaining: 125},
    ])('shows No detailed status with available replication metrics %p', (metrics) => {
        expect(getVDiskReplicationLabel({Replicated: false, ...metrics})).toMatchObject({
            title: 'Replication',
            value: 'No detailed status',
            theme: 'info',
            icon: ArrowsRotateLeft,
        });
    });

    test.each([
        {ReplicationProgress: -0.1},
        {ReplicationProgress: 1.1},
        {ReplicationProgress: NaN},
        {ReplicationSecondsRemaining: -1},
        {ReplicationSecondsRemaining: Infinity},
    ])('keeps Not replicated when replication metrics are invalid %p', (metrics) => {
        expect(getVDiskReplicationLabel({Replicated: false, ...metrics})?.value).toBe(
            'Not replicated',
        );
    });
});
