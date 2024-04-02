import React from 'react';

import {hideTooltip, showTooltip} from '../../../store/reducers/tooltip';
import {useTypedDispatch} from '../../../utils/hooks';
import {b} from '../QueryResultTable';

interface CellProps {
    className?: string;
    value: string;
}

export const Cell = React.memo(function Cell(props: CellProps) {
    const {className, value} = props;

    const dispatch = useTypedDispatch();

    React.useEffect(
        () => () => {
            dispatch(hideTooltip());
        },
        [dispatch],
    );

    return (
        <span
            className={b('cell', className)}
            onClick={(e) => dispatch(showTooltip(e.target, value, 'cell'))}
        >
            {value}
        </span>
    );
});
