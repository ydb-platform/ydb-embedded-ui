import React from 'react';

import {Skeleton} from '@gravity-ui/uikit';

import {DEFAULT_ALIGN, DEFAULT_RESIZEABLE} from '../constants';
import {b} from '../shared';
import type {AlignType} from '../types';

interface TableCellProps {
    height: number;
    width?: number;
    align?: AlignType;
    children: React.ReactNode;
    className?: string;
    resizeable?: boolean;
}

export function TableCell({
    children,
    className,
    height,
    width,
    align = DEFAULT_ALIGN,
    resizeable = DEFAULT_RESIZEABLE,
}: TableCellProps): React.ReactElement {
    return (
        <td
            className={b('row-cell', {align}, className)}
            style={{
                height: `${height}px`,
                width: `${width}px`,
                maxWidth: resizeable ? `${width}px` : undefined,
            }}
        >
            {children}
        </td>
    );
}

interface LoadingCellProps extends Omit<TableCellProps, 'children'> {}

export function LoadingCell(props: LoadingCellProps): React.ReactElement {
    return (
        <TableCell {...props}>
            <Skeleton className={b('row-skeleton')} style={{width: '80%', height: '50%'}} />
        </TableCell>
    );
}
