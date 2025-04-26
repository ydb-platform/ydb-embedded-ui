import React from 'react';

import {Skeleton} from '@gravity-ui/uikit';

import {DEFAULT_ALIGN, DEFAULT_RESIZEABLE} from './constants';
import {b} from './shared';
import type {AlignType, Column, GetRowClassName} from './types';
import {typedMemo} from './utils';

interface TableCellProps {
    height: number;
    width?: number;
    align?: AlignType;
    children: React.ReactNode;
    className?: string;
    resizeable?: boolean;
}

const TableRowCell = ({
    children,
    className,
    height,
    width,
    align = DEFAULT_ALIGN,
    resizeable,
}: TableCellProps) => {
    return (
        <td
            className={b('row-cell', {align: align}, className)}
            style={{
                height: `${height}px`,
                width: `${width}px`,
                // Additional maxWidth for resizeable columns to ensure overflow hidden for <td>
                maxWidth: resizeable ? `${width}px` : undefined,
            }}
        >
            {children}
        </td>
    );
};

interface VisibilityProps {
    isVisible?: boolean;
}

interface TableRowColumnProps<T> {
    column: Column<T>;
    row?: T;
    height: number;
}

export const TableRowColumn = typedMemo(
    <T,>({row, column, height, isVisible = true}: TableRowColumnProps<T> & VisibilityProps) => {
        const resizeable = column.resizeable ?? DEFAULT_RESIZEABLE;

        const renderedCell = React.useMemo(() => {
            if (row) {
                return column.render({row});
            }
            return null;
        }, [column, row]);

        return (
            <TableRowCell
                key={column.name}
                height={height}
                width={column.width}
                align={column.align}
                className={column.className}
                resizeable={resizeable}
            >
                {isVisible && row ? (
                    renderedCell
                ) : (
                    <Skeleton className={b('row-skeleton')} style={{width: '80%', height: '50%'}} />
                )}
            </TableRowCell>
        );
    },
);

interface TableRowProps<T> {
    columns: Column<T>[];
    row?: T;
    height: number;
    getRowClassName?: GetRowClassName<T>;
}

export const TableRow = <T,>({
    row,
    columns,
    getRowClassName,
    height,
    isVisible = true,
}: TableRowProps<T> & VisibilityProps) => {
    const additionalClassName = row ? getRowClassName?.(row) : undefined;

    return (
        <tr className={b('row', additionalClassName)}>
            {columns.map((column) => (
                <TableRowColumn
                    key={column.name}
                    column={column}
                    row={row}
                    height={height}
                    isVisible={isVisible}
                />
            ))}
        </tr>
    );
};

interface EmptyTableRowProps<T> {
    columns: Column<T>[];
    children?: React.ReactNode;
}

export const EmptyTableRow = <T,>({columns, children}: EmptyTableRowProps<T>) => {
    return (
        <tr className={b('row', {empty: true})}>
            <td colSpan={columns.length} className={b('td')}>
                {children}
            </td>
        </tr>
    );
};
