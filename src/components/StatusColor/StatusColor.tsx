import {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';

import './StatusColor.scss';

const b = cn('ydb-status-icon');

export type StatusColorSize = 'xs' | 's' | 'm' | 'l';

interface StatusColorProps {
    status?: EFlag;
    size?: StatusColorSize;
    className?: string;
}

export function StatusColor({status = EFlag.Grey, size = 's', className}: StatusColorProps) {
    const modifiers = {state: status.toLowerCase(), size};

    return <div className={b('status-color', modifiers, className)} />;
}
