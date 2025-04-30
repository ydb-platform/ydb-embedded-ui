import {cn} from '../../utils/cn';

import './MultilineTableHeader.scss';

const b = cn('ydb-multiline-table-header');

interface MultilineTableHeaderProps {
    title?: string;
}

export function MultilineTableHeader({title}: MultilineTableHeaderProps) {
    if (!title) {
        return null;
    }
    return <div className={b()}>{title}</div>;
}
