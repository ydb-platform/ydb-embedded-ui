import {Popover} from '@gravity-ui/uikit';
import type {PopoverProps} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './CellWithPopover.scss';

const b = cn('ydb-cell-with-popover');

interface CellWithPopoverProps extends PopoverProps {
    wrapperClassName?: string;
}

export function CellWithPopover({
    children,
    className,
    wrapperClassName,
    ...props
}: CellWithPopoverProps) {
    return (
        <div className={b(null, wrapperClassName)}>
            <Popover className={b('popover', className)} {...props}>
                {children}
            </Popover>
        </div>
    );
}
