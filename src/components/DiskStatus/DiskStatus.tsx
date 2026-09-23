import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Icon, Label, Tooltip} from '@gravity-ui/uikit';
import {capitalize} from 'lodash';

import {EFlag, isCapacityAlert} from '../../types/api/enums';
import {getCapacityAlertTheme, normalizeCapacityAlert} from '../../utils/capacityAlerts';
import {cn} from '../../utils/cn';
import {getFlagIconWithColor} from '../../utils/disks/iconCalculators';
import {EFlagToLabelTheme} from '../EntityStatus/utils';
import {getFlagStatusText} from '../VDisk/getFlagStatusText';

import i18n from './i18n';

import './DiskStatus.scss';

const b = cn('ydb-disk-status');

export interface DiskStatusLabelData {
    value: string;
    title?: string;
    theme?: LabelProps['theme'];
    icon?: IconData;
    tooltip?: string;
    dangerHeavy?: boolean;
}

export function DiskStatusLabel({
    value,
    theme = 'normal',
    icon,
    title,
    tooltip,
    dangerHeavy,
    size = 's',
}: DiskStatusLabelData & Pick<LabelProps, 'size'>) {
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

export function DiskTypeLabel({type}: {type?: string}) {
    const value = type?.toUpperCase() === 'NVME' ? 'NVMe' : type;
    let tooltip: string | undefined;
    switch (type?.toUpperCase()) {
        case 'HDD':
            tooltip = i18n('context_hdd');
            break;
        case 'SSD':
            tooltip = i18n('context_ssd');
            break;
        case 'NVME':
            tooltip = i18n('context_nvme');
            break;
    }
    return value ? <DiskStatusLabel value={value} tooltip={tooltip} /> : null;
}

export function DiskCapacityAlertLabel({
    value,
    emptyText = i18n('value_no-data'),
}: {
    value?: string;
    emptyText?: string;
}) {
    const capacityAlert = normalizeCapacityAlert(value);
    if (!capacityAlert) {
        return <DiskStatusLabel size="xs" value={emptyText} theme="unknown" />;
    }
    return (
        <DiskStatusLabel
            size="xs"
            value={capitalize(capacityAlert.replaceAll('_', ' '))}
            theme={isCapacityAlert(capacityAlert) ? getCapacityAlertTheme(capacityAlert) : 'normal'}
        />
    );
}

export function DiskFlagLabel({
    flag,
    title,
    icon,
}: {
    flag?: EFlag;
    title?: string;
    icon?: IconData;
}) {
    const resolvedFlag = flag || EFlag.Grey;
    return (
        <DiskStatusLabel
            value={
                resolvedFlag === EFlag.Grey
                    ? i18n('value_no-data')
                    : getFlagStatusText(resolvedFlag)
            }
            title={title}
            theme={EFlagToLabelTheme[resolvedFlag] ?? 'normal'}
            icon={icon ?? getFlagIconWithColor(resolvedFlag)?.icon}
            dangerHeavy={resolvedFlag === EFlag.Red}
            size="xs"
        />
    );
}
