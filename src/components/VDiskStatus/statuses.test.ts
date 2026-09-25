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
        expect(getVDiskReplicationLabel({Replicated: false})?.value).toBe('Not replicated');
        expect(getVDiskReplicationLabel({Replicated: true})?.value).toBe('Replicated');
        expect(getVDiskReplicationLabel({})).toBeUndefined();
    });
});
