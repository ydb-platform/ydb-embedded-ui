import {Popover} from '@gravity-ui/uikit';
import type {PopoverProps} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './CellWithPopover.scss';

const b = cn('ydb-cell-with-popover');

interface CellWithPopoverProps extends PopoverProps {
    wrapperClassName?: string;
    fullWidth?: boolean;
}

const DELAY_TIMEOUT = 100;

export function CellWithPopover({
    children,
    className,
    wrapperClassName,
    fullWidth,
    ...props
}: CellWithPopoverProps) {
    return (
        <div className={b({'full-width': fullWidth}, wrapperClassName)}>
            <Popover
                delayClosing={DELAY_TIMEOUT}
                delayOpening={DELAY_TIMEOUT}
                className={b('popover', {'full-width': fullWidth}, className)}
                {...props}
            >
                {children}
            </Popover>
        </div>
    );
}
