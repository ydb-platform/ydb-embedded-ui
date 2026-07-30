import React from 'react';

import type {IconData} from '@gravity-ui/uikit';
import {Flex, Icon, Text} from '@gravity-ui/uikit';

import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {cn} from '../../utils/cn';
import {DONOR_COLOR, NOT_AVAILABLE_SEVERITY} from '../../utils/disks/constants';
import {getDisplaySeverityColor, getVDiskStatusIcon} from '../../utils/disks/helpers';
import type {IconWithColor} from '../../utils/disks/iconCalculators';
import {useSetting} from '../../utils/hooks';
import {isNumeric} from '../../utils/utils';

import './DiskStateProgressBar.scss';

const b = cn('storage-disk-progress-bar');

function renderCapacityAlertIndicator(indicator?: IconData | string) {
    if (!indicator) {
        return null;
    }

    if (typeof indicator === 'string') {
        return indicator;
    }

    return (
        <Icon className={b('all-mode-capacity-alert-indicator-icon')} data={indicator} size={12} />
    );
}

interface DiskStateProgressBarProps {
    diskAllocatedPercent?: number;
    hideAllocatedPercentLabel?: boolean;
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
    icon?: IconData | IconWithColor[] | string;
    capacityAlertIndicator?: IconData | string;
    frontQueuesIndicator?: IconData;
    modeModifier?: string;
    highlighted?: boolean;
    noDataPlaceholder?: React.ReactNode;
    prioritizeNoDataPlaceholder?: boolean;
    overlapIconAtTopLeft?: boolean;
    isLegendInactive?: boolean;
}

export function DiskStateProgressBar({
    diskAllocatedPercent = -1,
    hideAllocatedPercentLabel,
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
    capacityAlertIndicator,
    frontQueuesIndicator,
    modeModifier,
    highlighted,
    noDataPlaceholder,
    prioritizeNoDataPlaceholder,
    overlapIconAtTopLeft,
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
        'overlap-icon-at-top-left': overlapIconAtTopLeft,
    };

    // Add mode modifier if present
    if (modeModifier) {
        mods[modeModifier] = true;
        mods['expert-mode'] = true;
    }

    if (isDonor) {
        mods[DONOR_COLOR.toLocaleLowerCase()] = true;
    } else {
        const color = getDisplaySeverityColor(severity);
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

        if (!compact && hasAllocatedPercent && !hideAllocatedPercentLabel) {
            return <div className={b('title')}>{`${Math.floor(diskAllocatedPercent)}%`}</div>;
        }

        if (
            !compact &&
            (!hasAllocatedPercent || prioritizeNoDataPlaceholder) &&
            noDataPlaceholder
        ) {
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
            } else if (Array.isArray(icon)) {
                // Multiple icons with individual colors (e.g., for compaction mode: Fresh + Level)
                // Icons overlap: 10px + 10px - 3px = 17px total width
                iconElement = (
                    <div className={b('icon-group')}>
                        {icon.map((item, index) => {
                            // Check if item has color property (IconWithColor)
                            const iconData = 'icon' in item ? item.icon : item;
                            const iconColor = 'color' in item ? item.color : undefined;

                            return (
                                <Icon
                                    key={index}
                                    className={b('icon', {overlapped: index > 0})}
                                    data={iconData}
                                    size={10}
                                    style={iconColor ? {color: iconColor} : undefined}
                                />
                            );
                        })}
                    </div>
                );
            } else {
                iconElement = (
                    <Icon
                        className={b('icon', {'overlap-top-left': overlapIconAtTopLeft})}
                        data={icon}
                        size={12}
                    />
                );
            }
        }
    }

    const hasIcon = Boolean(iconElement);
    const justifyContent = hasIcon ? 'space-between' : 'flex-end';
    const showAllModeIndicators = !compact && modeModifier === 'mode-all';

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
            {showAllModeIndicators && (
                <div className={b('all-mode-indicators')}>
                    <Text
                        as="span"
                        variant="caption-2"
                        color="primary"
                        className={b('all-mode-capacity-alert-indicator-slot')}
                    >
                        {renderCapacityAlertIndicator(capacityAlertIndicator)}
                    </Text>
                    <span className={b('all-mode-front-queues-indicator-slot')}>
                        {frontQueuesIndicator && <Icon data={frontQueuesIndicator} size={12} />}
                    </span>
                </div>
            )}
        </Flex>
    );
}
