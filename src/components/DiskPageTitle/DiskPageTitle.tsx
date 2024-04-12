import type {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {StatusIcon} from '../StatusIcon/StatusIcon';

import './DiskPageTitle.scss';

const b = cn('ydb-disk-page-title');

interface DiskPageTitleProps {
    entityName: React.ReactNode;
    status: EFlag;
    id: React.ReactNode;
    className?: string;
}

export function DiskPageTitle({entityName, status, id, className}: DiskPageTitleProps) {
    return (
        <div className={b(null, className)}>
            <span className={b('prefix')}>{entityName}</span>
            <StatusIcon className={b('icon')} status={status} size="s" />
            {id}
        </div>
    );
}
