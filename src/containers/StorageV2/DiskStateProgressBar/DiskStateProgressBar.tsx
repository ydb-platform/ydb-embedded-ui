import React, {useContext} from 'react';
import HistoryContext from '../../../contexts/HistoryContext';
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
    const history = useContext(HistoryContext);
    const onDiskClick = () => {
        if (href) {
            history.push(href);
        }
    };
    return (
        <div
            className={
                severity !== undefined
                    ? b({[diskProgressColors[severity].toLowerCase()]: true})
                    : undefined
            }
            onClick={onDiskClick}
        >
            {diskAllocatedPercent >= 0 && (
                <React.Fragment>
                    <div className={b('filled')} style={{width: `${diskAllocatedPercent}%`}} />
                    <div className={b('filled-title', {light: diskAllocatedPercent > 7})}>
                        {`${Math.round(diskAllocatedPercent)}%`}
                    </div>
                </React.Fragment>
            )}
        </div>
    );
}

export default DiskStateProgressBar;
