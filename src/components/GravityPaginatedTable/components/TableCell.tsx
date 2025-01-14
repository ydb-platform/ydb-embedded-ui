import React from 'react';

import {Skeleton} from '@gravity-ui/uikit';

import {DEFAULT_ALIGN, DEFAULT_RESIZEABLE} from '../../PaginatedTable/constants';
import {b as tableB} from '../../PaginatedTable/shared';
import type {AlignType} from '../../PaginatedTable/types';

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
            className={tableB('row-cell', {align}, className)}
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
            <Skeleton className={tableB('row-skeleton')} style={{width: '80%', height: '50%'}} />
        </TableCell>
    );
}
