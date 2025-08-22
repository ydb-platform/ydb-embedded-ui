import React from 'react';

import {Popover} from '@gravity-ui/uikit';
import type {PopoverProps} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './CellWithPopover.scss';

const b = cn('ydb-cell-with-popover');

interface CellWithPopoverProps extends Omit<PopoverProps, 'children'> {
    wrapperClassName?: string;
    fullWidth?: boolean;
    children: React.ReactNode;
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
                openDelay={DELAY_TIMEOUT}
                closeDelay={DELAY_TIMEOUT}
                className={b('popover', {'full-width': fullWidth}, className)}
                {...props}
            >
                <div className={b('children-wrapper', {'full-width': fullWidth})}>{children}</div>
            </Popover>
        </div>
    );
}
