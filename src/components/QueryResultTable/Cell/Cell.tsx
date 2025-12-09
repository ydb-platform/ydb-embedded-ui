import React from 'react';

import {Popup} from '@gravity-ui/uikit';

import {b} from '../QueryResultTable';

interface CellProps {
    className?: string;
    value: string;
    isActive: boolean;
    onToggle: () => void;
}

export const Cell = React.memo(function Cell(props: CellProps) {
    const {className, value, isActive, onToggle} = props;

    const anchorRef = React.useRef<HTMLSpanElement | null>(null);

    return (
        <React.Fragment>
            <Popup
                open={isActive}
                hasArrow
                placement={['top', 'bottom']}
                anchorRef={anchorRef}
                onOutsideClick={onToggle}
            >
                <div className={b('cell-popup')}>{value}</div>
            </Popup>
            <span ref={anchorRef} className={b('cell', className)} onClick={onToggle}>
                {value}
            </span>
        </React.Fragment>
    );
});
