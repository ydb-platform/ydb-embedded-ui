import cn from 'bem-cn-lite';

import {CellWithPopover} from '../CellWithPopover/CellWithPopover';

import './TruncatedQuery.scss';

const b = cn('kv-truncated-query');

interface TruncatedQueryProps {
    value?: string;
    maxQueryHeight?: number;
}

export const TruncatedQuery = ({value = '', maxQueryHeight = 6}: TruncatedQueryProps) => {
    const lines = value.split('\n');
    const truncated = lines.length > maxQueryHeight;

    if (truncated) {
        const content = lines.slice(0, maxQueryHeight).join('\n');
        const message =
            '\n...\nThe request was truncated. Click on the line to show the full query on the query tab';
        return (
            <>
                <span className={b()}>{content}</span>
                <span className={b('message', {color: 'secondary'})}>{message}</span>
            </>
        );
    }
    return <>{value}</>;
};

interface OneLineQueryWithPopoverProps {
    value?: string;
}

export const OneLineQueryWithPopover = ({value = ''}: OneLineQueryWithPopoverProps) => {
    return (
        <CellWithPopover contentClassName={b('popover-content')} content={value}>
            {value}
        </CellWithPopover>
    );
};
