import React from 'react';

import type {IconData} from '@gravity-ui/uikit';
import {Flex, Icon} from '@gravity-ui/uikit';

import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {cn} from '../../utils/cn';
import {DONOR_COLOR, NOT_AVAILABLE_SEVERITY} from '../../utils/disks/constants';
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
    icon?: IconData | string;
    modeModifier?: string;
    highlighted?: boolean;
    noDataPlaceholder?: React.ReactNode;
    isLegendInactive?: boolean;
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
    icon: providedIcon,
    modeModifier,
    highlighted,
    noDataPlaceholder,
    isLegendInactive,
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
        'legend-inactive': isLegendInactive,
    };

    // Add mode modifier if present
    if (modeModifier) {
        mods[modeModifier] = true;
    }

    if (isDonor) {
        mods[DONOR_COLOR.toLocaleLowerCase()] = true;
    } else {
        const color = getSeverityColor(severity);
        if (color) {
            mods[color.toLocaleLowerCase()] = true;
        }
    }

    const hasAllocatedPercent = isNumeric(diskAllocatedPercent) && diskAllocatedPercent >= 0;

    const renderAllocatedPercent = () => {
        if (compact) {
            return null;
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
            return <div className={b('title', {text: true})}>{noDataPlaceholder}</div>;
        }

        if (compact && severity === NOT_AVAILABLE_SEVERITY && noDataPlaceholder) {
            return <div className={b('title', {compact: true})}>{noDataPlaceholder}</div>;
        }

        return null;
    };

    let iconElement: React.ReactNode = null;

    const hideIcon = isLegendInactive && !isDonor;

    if (withIcon && !hideIcon) {
        // Use provided icon if available, otherwise calculate
        const icon = providedIcon ?? getVDiskStatusIcon(severity, isDonor);

        if (icon) {
            // Check if icon is a string (text label for space mode)
            if (typeof icon === 'string') {
                iconElement = <div className={b('text-label')}>{icon}</div>;
            } else {
                iconElement = <Icon className={b('icon')} data={icon} size={12} />;
            }
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
