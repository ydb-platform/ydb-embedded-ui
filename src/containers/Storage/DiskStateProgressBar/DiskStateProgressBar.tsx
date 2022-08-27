import React from 'react';
import {useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import {INVERTED_DISKS_KEY} from '../../../utils/constants';
import {getSettingValue} from '../../../store/reducers/settings';

import InternalLink from '../../../components/InternalLink/InternalLink';

import './DiskStateProgressBar.scss';

const b = cn('storage-disk-progress-bar');

export const diskProgressColors = {
    0: 'Grey',
    1: 'Green',
    2: 'Blue',
    3: 'Yellow',
    4: 'Orange',
    5: 'Red',
};

interface DiskStateProgressBarProps {
    diskAllocatedPercent?: number;
    severity?: keyof typeof diskProgressColors;
    href?: string;
}

function DiskStateProgressBar({
    diskAllocatedPercent = -1,
    severity,
    href,
}: DiskStateProgressBarProps) {
    const inverted = useSelector((state) => getSettingValue(state, INVERTED_DISKS_KEY));

    const renderAllocatedPercent = () => {
        return (
            diskAllocatedPercent >= 0 && (
                <React.Fragment>
                    <div
                        className={b('filled')}
                        style={{width: `${inverted ? 100 - diskAllocatedPercent : diskAllocatedPercent}%`}}
                    />
                    <div className={b('filled-title')}>
                        {`${Math.round(diskAllocatedPercent)}%`}
                    </div>
                </React.Fragment>
            )
        );
    };

    const mods: Record<string, boolean | undefined> = {inverted};
    if (severity !== undefined && severity in diskProgressColors) {
        mods[diskProgressColors[severity].toLocaleLowerCase()] = true;
    }

    return (
        <div
            className={b(mods)}
            role="meter"
            aria-label="Disk allocated space"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={diskAllocatedPercent}
        >
            {href ? (
                <InternalLink to={href} className={b('link')}>
                    {renderAllocatedPercent()}
                </InternalLink>
            ) : (
                renderAllocatedPercent()
            )}
        </div>
    );
}

export default DiskStateProgressBar;
