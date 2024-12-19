import {cn} from '../../utils/cn';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {Snippet} from '../Snippet/Snippet';

import './TruncatedQuery.scss';

const b = cn('kv-truncated-query');

interface TruncatedQueryProps {
    value?: string;
}

export const TruncatedQuery = ({value = ''}: TruncatedQueryProps) => {
    return <Snippet>{value}</Snippet>;
};

interface OneLineQueryWithPopoverProps {
    value?: string;
}

export const OneLineQueryWithPopover = ({value = ''}: OneLineQueryWithPopoverProps) => {
    return (
        <CellWithPopover
            contentClassName={b('popover-content')}
            content={<Snippet>{value}</Snippet>}
        >
            <Snippet>{value}</Snippet>
        </CellWithPopover>
    );
};
