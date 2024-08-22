import type {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {StatusIcon} from '../StatusIcon/StatusIcon';

import './EntityPageTitle.scss';

const b = cn('ydb-entity-page-title');

interface EntityPageTitleProps {
    entityName: React.ReactNode;
    status: EFlag;
    id: React.ReactNode;
    className?: string;
}

export function EntityPageTitle({entityName, status, id, className}: EntityPageTitleProps) {
    return (
        <div className={b(null, className)}>
            <span className={b('prefix')}>{entityName}</span>
            <StatusIcon className={b('icon')} status={status} size="s" />
            {id}
        </div>
    );
}
