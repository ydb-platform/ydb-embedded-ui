import React, {useEffect} from 'react';
import {useDispatch} from 'react-redux';

import {showTooltip, hideTooltip} from '../../../store/reducers/tooltip';

import {b} from '../QueryResultTable';

interface CellProps {
    className?: string;
    value: string;
}

export const Cell = React.memo(function Cell(props: CellProps) {
    const {
        className,
        value,
    } = props;

    const dispatch = useDispatch();

    useEffect(() => () => {
        dispatch(hideTooltip());
    }, [dispatch]);

    return (
        <span
            className={b('cell', className)}
            onClick={(e) => dispatch(showTooltip(e.target, value, 'cell'))}
        >
            {value}
        </span>
    )
});
