import React from 'react';

import {cn} from '../../utils/cn';
import {INVERTED_DISKS_KEY} from '../../utils/constants';
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
    const [inverted] = useSetting<boolean | undefined>(INVERTED_DISKS_KEY);

    const mods: Record<string, boolean | undefined> = {inverted, compact, faded, empty, inactive};

    const color = severity !== undefined && getSeverityColor(severity);
    if (color) {
        mods[color.toLocaleLowerCase()] = true;
    }

    const renderAllocatedPercent = () => {
        if (compact) {
            return <div className={b('fill-bar', mods)} style={{width: '100%'}} />;
        }

        const fillWidth = inverted ? 100 - diskAllocatedPercent : diskAllocatedPercent;

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
