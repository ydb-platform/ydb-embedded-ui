import React from 'react';
import InternalLink from '../../../components/InternalLink/InternalLink';
import cn from 'bem-cn-lite';

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
    const renderAllocatedPercent = () => {
        return (
            diskAllocatedPercent >= 0 && (
                <React.Fragment>
                    <div className={b('filled')} style={{width: `${diskAllocatedPercent}%`}} />
                    <div className={b('filled-title')}>
                        {`${Math.round(diskAllocatedPercent)}%`}
                    </div>
                </React.Fragment>
            )
        );
    };

    return (
        <div
            className={
                severity !== undefined
                    ? b({[diskProgressColors[severity].toLowerCase()]: true})
                    : undefined
            }
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
