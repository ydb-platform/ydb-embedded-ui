import React from 'react';

import {Popup} from '@gravity-ui/uikit';

import {b} from '../QueryResultTable';

interface CellProps {
    className?: string;
    value: string;
}

export const Cell = React.memo(function Cell(props: CellProps) {
    const {className, value} = props;

    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLSpanElement | null>(null);

    const handleToggle = React.useCallback(() => {
        setOpen((prevOpen) => !prevOpen);
    }, []);

    const handleClose = React.useCallback(() => {
        setOpen(false);
    }, []);

    return (
        <React.Fragment>
            <Popup
                open={open}
                hasArrow
                placement={['top', 'bottom']}
                anchorRef={anchorRef}
                onOutsideClick={handleClose}
            >
                <div className={b('cell-popup')}>{value}</div>
            </Popup>
            <span ref={anchorRef} className={b('cell', className)} onClick={handleToggle}>
                {value}
            </span>
        </React.Fragment>
    );
});
