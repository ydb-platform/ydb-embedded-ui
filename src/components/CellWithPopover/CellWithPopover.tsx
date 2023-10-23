import cn from 'bem-cn-lite';

import {Popover, type PopoverProps} from '@gravity-ui/uikit';

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
