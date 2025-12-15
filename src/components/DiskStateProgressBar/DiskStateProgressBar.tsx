import React from 'react';

import {Flex, Icon} from '@gravity-ui/uikit';

import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {cn} from '../../utils/cn';
import {DONOR_COLOR} from '../../utils/disks/constants';
import {getSeverityColor, getVDiskStatusIcon} from '../../utils/disks/helpers';
import {useSetting} from '../../utils/hooks';
import {isNumeric} from '../../utils/utils';

import './DiskStateProgressBar.scss';

const b = cn('storage-disk-progress-bar');

interface DiskStateProgressBarProps {
    diskAllocatedPercent?: number;
    severity?: number;
    compact?: boolean;
    faded?: boolean;
    inactive?: boolean;
    empty?: boolean;
    striped?: boolean;
    content?: React.ReactNode;
    className?: string;
    isDonor?: boolean;
    withIcon?: boolean;
    highlighted?: boolean;
    darkened?: boolean;
    noDataPlaceholder?: React.ReactNode;
}

export function DiskStateProgressBar({
    diskAllocatedPercent = -1,
    severity,
    compact,
    faded,
    inactive,
    empty,
    content,
    striped,
    className,
    isDonor,
    withIcon,
    highlighted,
    darkened,
    noDataPlaceholder,
}: DiskStateProgressBarProps) {
    const [inverted] = useSetting<boolean | undefined>(SETTING_KEYS.INVERTED_DISKS);

    const mods: Record<string, boolean | undefined> = {
        inverted,
        compact,
        faded,
        empty,
        inactive,
        striped,
        highlighted,
        darkened,
    };

    if (isDonor) {
        mods[DONOR_COLOR.toLocaleLowerCase()] = true;
    } else {
        const color = severity !== undefined && getSeverityColor(severity);
        if (color) {
            mods[color.toLocaleLowerCase()] = true;
        }
    }

    const hasAllocatedPercent = isNumeric(diskAllocatedPercent) && diskAllocatedPercent >= 0;

    const renderAllocatedPercent = () => {
        if (compact) {
            return <div className={b('fill-bar', mods)} style={{width: '100%'}} />;
        }

        if (!hasAllocatedPercent) {
            return null;
        }

        // diskAllocatedPercent could be more than 100
        let fillWidth = Math.min(diskAllocatedPercent, 100);
        if (inverted) {
            fillWidth = Math.max(100 - diskAllocatedPercent, 0);
        }

        return <div className={b('fill-bar', mods)} style={{width: `${fillWidth}%`}} />;
    };

    const renderContent = () => {
        if (content) {
            return content;
        }

        if (!compact && hasAllocatedPercent) {
            return <div className={b('title')}>{`${Math.floor(diskAllocatedPercent)}%`}</div>;
        }

        if (!compact && !hasAllocatedPercent && noDataPlaceholder) {
            return <div className={b('title')}>{noDataPlaceholder}</div>;
        }

        return null;
    };

    let iconElement: React.ReactNode = null;

    if (withIcon) {
        const icon = getVDiskStatusIcon(severity, isDonor);

        if (icon) {
            iconElement = <Icon className={b('icon')} data={icon} size={12} />;
        }
    }

    const hasIcon = Boolean(iconElement);
    const justifyContent = hasIcon ? 'space-between' : 'flex-end';

    return (
        <Flex
            alignItems="center"
            justifyContent={justifyContent}
            className={b(mods, className)}
            role="meter"
            aria-label="Disk allocated space"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={hasAllocatedPercent ? diskAllocatedPercent : undefined}
        >
            {iconElement}
            {renderAllocatedPercent()}
            {renderContent()}
        </Flex>
    );
}
