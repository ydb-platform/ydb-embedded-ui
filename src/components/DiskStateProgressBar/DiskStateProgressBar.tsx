import React from 'react';

import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {cn} from '../../utils/cn';
import {getSeverityColor} from '../../utils/disks/helpers';
import {useSetting} from '../../utils/hooks';

import './DiskStateProgressBar.scss';

const b = cn('storage-disk-progress-bar');

interface DiskStateProgressBarProps {
    diskAllocatedPercent?: number;
    severity?: number;
    compact?: boolean;
    faded?: boolean;
    inactive?: boolean;
    empty?: boolean;
    content?: React.ReactNode;
    className?: string;
}

export function DiskStateProgressBar({
    diskAllocatedPercent = -1,
    severity,
    compact,
    faded,
    inactive,
    empty,
    content,
    className,
}: DiskStateProgressBarProps) {
    const [inverted] = useSetting<boolean | undefined>(SETTING_KEYS.INVERTED_DISKS);

    const mods: Record<string, boolean | undefined> = {inverted, compact, faded, empty, inactive};

    const color = severity !== undefined && getSeverityColor(severity);
    if (color) {
        mods[color.toLocaleLowerCase()] = true;
    }

    const renderAllocatedPercent = () => {
        if (compact) {
            return <div className={b('fill-bar', mods)} style={{width: '100%'}} />;
        }

        // diskAllocatedPercent could be more than 100
        let fillWidth = Math.min(diskAllocatedPercent, 100);
        if (inverted) {
            fillWidth = Math.max(100 - diskAllocatedPercent, 0);
        }

        if (diskAllocatedPercent >= 0) {
            return <div className={b('fill-bar', mods)} style={{width: `${fillWidth}%`}} />;
        }

        return null;
    };

    const renderContent = () => {
        if (content) {
            return content;
        }

        if (!compact && diskAllocatedPercent >= 0) {
            return <div className={b('title')}>{`${Math.floor(diskAllocatedPercent)}%`}</div>;
        }

        return null;
    };

    return (
        <div
            className={b(mods, className)}
            role="meter"
            aria-label="Disk allocated space"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={diskAllocatedPercent}
        >
            {renderAllocatedPercent()}
            {renderContent()}
        </div>
    );
}
