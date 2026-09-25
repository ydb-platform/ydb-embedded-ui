import type {LabelProps} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import type {EVDiskState} from '../../types/api/vdisk';
import {VDISK_LABEL_CONFIG} from '../../utils/disks/constants';
import {calculateFrontQueuesIcon} from '../../utils/disks/iconCalculators';
import {DiskFlagLabel, DiskStatusLabel} from '../DiskStatus/DiskStatus';

import {vDiskStatusKeyset as i18n} from './i18n';
import {getVDiskStateLabel} from './statuses';

export function VDiskStateLabel({state, size}: {state?: EVDiskState} & Pick<LabelProps, 'size'>) {
    return <DiskStatusLabel {...getVDiskStateLabel({VDiskState: state})} size={size} />;
}

export function VDiskDonorLabel({
    donorMode,
    size,
}: {donorMode?: boolean} & Pick<LabelProps, 'size'>) {
    return donorMode ? (
        <DiskStatusLabel value={i18n('label_donor')} {...VDISK_LABEL_CONFIG.donor} size={size} />
    ) : null;
}

export function VDiskFrontQueuesLabel({flag}: {flag?: EFlag}) {
    return (
        <DiskFlagLabel
            flag={flag}
            icon={calculateFrontQueuesIcon({FrontQueues: flag || EFlag.Grey})}
        />
    );
}

export function VDiskCompactionRankLabel({flag, rank}: {flag?: EFlag; rank: 'fresh' | 'level'}) {
    return (
        <DiskFlagLabel flag={flag} title={i18n(rank === 'fresh' ? 'label_fresh' : 'label_level')} />
    );
}
