import cn from 'bem-cn-lite';

import {CellWithPopover} from '../CellWithPopover/CellWithPopover';

import './TruncatedQuery.scss';

const b = cn('kv-truncated-query');

interface TopQueriesTruncatedQueryProps {
    value: string | undefined;
}

export const TopQueriesTruncatedQuery = ({value = ''}: TopQueriesTruncatedQueryProps) => {
    const content = value.split('\n').slice(0, 5).join('\n');
    return (
        <CellWithPopover contentClassName={b('popover-content')} content={content}>
            {value}
        </CellWithPopover>
    );
};
