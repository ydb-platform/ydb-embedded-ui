import React from 'react';

import {ClipboardButton, Popup} from '@gravity-ui/uikit';

import {b} from '../QueryResultTable';

interface CellProps {
    className?: string;
    value: string;
}

//helper function to try to format a string as JSON, if it fails, return the original string
function tryFormatJson(value: string): {formatted: string; isJson: boolean} {
    try {
        const parsed = JSON.parse(value);
        if (typeof parsed !== 'object' || parsed === null) {
            return {formatted: value, isJson: false};
        }
        return {formatted: JSON.stringify(parsed, null, 2), isJson: true};
    } catch {
        return {formatted: value, isJson: false};
    }
}

export const Cell = React.memo(function Cell(props: CellProps) {
    const {className, value} = props;

    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLSpanElement | null>(null);
    const {formatted, isJson} = React.useMemo(() => tryFormatJson(value), [value]);

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
                <div className={b('cell-popup')}>
                    {isJson ? <pre className={b('cell-popup-json')}>{formatted}</pre> : formatted}
                    <ClipboardButton text={formatted} size="s" className={b('cell-popup-copy')} />
                </div>
            </Popup>
            <span ref={anchorRef} className={b('cell', className)} onClick={handleToggle}>
                {value}
            </span>
        </React.Fragment>
    );
});
