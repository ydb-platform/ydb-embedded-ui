import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Icon, Label, Tooltip} from '@gravity-ui/uikit';
import {capitalize} from 'lodash';

import {EFlag, isCapacityAlert} from '../../types/api/enums';
import {normalizeCapacityAlert} from '../../utils/capacityAlerts';
import {cn} from '../../utils/cn';
import {formatPDiskType} from '../../utils/disks/getPDiskType';
import {getDisplaySeverityColor} from '../../utils/disks/helpers';
import {getFlagIconWithColor} from '../../utils/disks/iconCalculators';
import {normalizeMediaType} from '../../utils/disks/normalizeMediaType';
import {calculateSpaceSeverity} from '../../utils/disks/severityCalculators';
import {EFlagToLabelTheme} from '../EntityStatus/EntityStatus';
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

export type TitledDiskStatusLabelData = Omit<DiskStatusLabelData, 'title' | 'value'> & {
    title: string;
    value?: string;
};

export function DiskStatusLabel({
    value,
    theme = 'normal',
    icon,
    title,
    tooltip,
    dangerHeavy,
    size = 's',
    className,
}: (DiskStatusLabelData | TitledDiskStatusLabelData) & Pick<LabelProps, 'size' | 'className'>) {
    const label = (
        <Label
            size={size}
            theme={theme}
            className={b('label', {'danger-heavy': dangerHeavy}, className)}
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

export function DiskTypeLabel({type, size}: {type?: string} & Pick<LabelProps, 'size'>) {
    if (!type?.trim()) {
        return null;
    }
    const mediaType = normalizeMediaType(type);
    const value = formatPDiskType(mediaType) ?? mediaType;
    let tooltip: string | undefined;
    switch (mediaType) {
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
    return (
        <DiskStatusLabel
            value={value}
            tooltip={tooltip}
            size={size}
            className={b('type', {
                hdd: mediaType === 'HDD',
                ssd: mediaType === 'SSD',
                nvme: mediaType === 'NVME',
            })}
        />
    );
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
    const color = isCapacityAlert(capacityAlert)
        ? getDisplaySeverityColor(
              calculateSpaceSeverity({CapacityAlert: capacityAlert}),
          ).toLowerCase()
        : undefined;
    return (
        <DiskStatusLabel
            size="xs"
            value={capitalize(capacityAlert.replaceAll('_', ' '))}
            className={b('capacity-alert', {color})}
        />
    );
}

export function DiskFlagLabel({
    flag,
    title,
    icon,
    emptyText = i18n('value_no-data'),
}: {
    flag?: EFlag;
    title?: string;
    icon?: IconData;
    emptyText?: string;
}) {
    const resolvedFlag = flag || EFlag.Grey;
    return (
        <DiskStatusLabel
            value={resolvedFlag === EFlag.Grey ? emptyText : getFlagStatusText(resolvedFlag)}
            title={title}
            theme={EFlagToLabelTheme[resolvedFlag] ?? 'normal'}
            icon={icon ?? getFlagIconWithColor(resolvedFlag)?.icon}
            dangerHeavy={resolvedFlag === EFlag.Red}
            size="xs"
        />
    );
}
