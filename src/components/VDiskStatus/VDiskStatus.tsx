import type {LabelProps} from '@gravity-ui/uikit';
import {Icon, Label, Tooltip} from '@gravity-ui/uikit';
import {capitalize} from 'lodash';

import {EFlag, isCapacityAlert} from '../../types/api/enums';
import type {EVDiskState} from '../../types/api/vdisk';
import {getCapacityAlertTheme, normalizeCapacityAlert} from '../../utils/capacityAlerts';
import {cn} from '../../utils/cn';
import {VDISK_LABEL_CONFIG} from '../../utils/disks/constants';
import {calculateFrontQueuesIcon, getFlagIconWithColor} from '../../utils/disks/iconCalculators';
import {EFlagToLabelTheme} from '../EntityStatus/utils';
import {getFlagStatusText} from '../VDisk/getFlagStatusText';

import {vDiskStatusKeyset as i18n} from './i18n';
import type {VDiskStatusLabel as VDiskStatusLabelData} from './statuses';
import {getVDiskStateLabel, getVDiskTypeTooltip} from './statuses';

import './VDiskStatus.scss';

const b = cn('ydb-vdisk-status');

export function VDiskStatusLabel({
    value,
    theme = 'normal',
    icon,
    title,
    tooltip,
    dangerHeavy,
    size = 's',
}: VDiskStatusLabelData & Pick<LabelProps, 'size'>) {
    const label = (
        <Label
            size={size}
            theme={theme}
            className={b('label', {'danger-heavy': dangerHeavy})}
            icon={icon ? <Icon data={icon} size={12} /> : undefined}
            value={title ? value : undefined}
        >
            {title ?? value}
        </Label>
    );
    return tooltip ? (
        <Tooltip content={tooltip} placement="top">
            <span tabIndex={0} className={b('tooltip')}>
                {label}
            </span>
        </Tooltip>
    ) : (
        label
    );
}

export function VDiskStateLabel({state}: {state?: EVDiskState}) {
    return <VDiskStatusLabel {...getVDiskStateLabel({VDiskState: state})} />;
}

export function VDiskDonorLabel({donorMode}: {donorMode?: boolean}) {
    return donorMode ? (
        <VDiskStatusLabel value={i18n('label_donor')} {...VDISK_LABEL_CONFIG.donor} />
    ) : null;
}

export function VDiskTypeLabel({type}: {type?: string}) {
    const value = type?.toUpperCase() === 'NVME' ? 'NVMe' : type;
    return value ? <VDiskStatusLabel value={value} tooltip={getVDiskTypeTooltip(type)} /> : null;
}

export function VDiskCapacityAlertLabel({value}: {value?: string}) {
    const capacityAlert = normalizeCapacityAlert(value);
    if (!capacityAlert) {
        return <VDiskStatusLabel size="xs" value={i18n('value_no-data')} theme="unknown" />;
    }

    return (
        <VDiskStatusLabel
            size="xs"
            value={capitalize(capacityAlert.replaceAll('_', ' '))}
            theme={isCapacityAlert(capacityAlert) ? getCapacityAlertTheme(capacityAlert) : 'normal'}
        />
    );
}

function VDiskFlagLabel({
    flag,
    title,
    frontQueues = false,
}: {
    flag?: EFlag;
    title?: string;
    frontQueues?: boolean;
}) {
    const resolvedFlag = flag || EFlag.Grey;
    const theme = EFlagToLabelTheme[resolvedFlag] ?? 'normal';
    const icon = frontQueues
        ? calculateFrontQueuesIcon({FrontQueues: resolvedFlag})
        : getFlagIconWithColor(resolvedFlag)?.icon;

    return (
        <VDiskStatusLabel
            value={
                resolvedFlag === EFlag.Grey
                    ? i18n('value_no-data')
                    : getFlagStatusText(resolvedFlag)
            }
            title={title}
            theme={theme}
            icon={icon}
            dangerHeavy={resolvedFlag === EFlag.Red}
            size="xs"
        />
    );
}

export function VDiskFrontQueuesLabel({flag}: {flag?: EFlag}) {
    return <VDiskFlagLabel flag={flag} frontQueues />;
}

export function VDiskCompactionRankLabel({flag, rank}: {flag?: EFlag; rank: 'fresh' | 'level'}) {
    return (
        <VDiskFlagLabel
            flag={flag}
            title={i18n(rank === 'fresh' ? 'label_fresh' : 'label_level')}
        />
    );
}
