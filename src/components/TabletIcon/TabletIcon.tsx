import {cn} from '../../utils/cn';

import './TabletIcon.scss';

interface TabletIconProps {
    text?: string;
    className?: string;
}

const b = cn('tablet-icon');

export const TabletIcon = ({text, className}: TabletIconProps) => {
    return (
        <div className={b(null, className)}>
            <div className={b('type')}>{text || 'T'}</div>
        </div>
    );
};
