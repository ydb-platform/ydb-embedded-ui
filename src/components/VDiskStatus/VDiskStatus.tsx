import {EFlag} from '../../types/api/enums';
import type {EVDiskState} from '../../types/api/vdisk';
import {VDISK_LABEL_CONFIG} from '../../utils/disks/constants';
import {calculateFrontQueuesIcon} from '../../utils/disks/iconCalculators';
import {DiskFlagLabel, DiskStatusLabel} from '../DiskStatus/DiskStatus';

import {vDiskStatusKeyset as i18n} from './i18n';
import {getVDiskStateLabel} from './statuses';

export function VDiskStateLabel({state}: {state?: EVDiskState}) {
    return <DiskStatusLabel {...getVDiskStateLabel({VDiskState: state})} />;
}

export function VDiskDonorLabel({donorMode}: {donorMode?: boolean}) {
    return donorMode ? (
        <DiskStatusLabel value={i18n('label_donor')} {...VDISK_LABEL_CONFIG.donor} />
    ) : null;
}

export function VDiskFrontQueuesLabel({flag}: {flag?: EFlag}) {
    return (
        <DiskFlagLabel
            flag={flag}
            icon={calculateFrontQueuesIcon({FrontQueues: flag || EFlag.Grey})}
            emptyText={i18n('value_no-data')}
        />
    );
}

export function VDiskCompactionRankLabel({flag, rank}: {flag?: EFlag; rank: 'fresh' | 'level'}) {
    return (
        <DiskFlagLabel
            flag={flag}
            title={i18n(rank === 'fresh' ? 'label_fresh' : 'label_level')}
            emptyText={i18n('value_no-data')}
        />
    );
}
