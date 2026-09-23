import React from 'react';

import {Skeleton} from '@gravity-ui/uikit';

import {KEYBOARD_FOCUSED_ROW_CLASS_NAME} from '../TableKeyboardNavigation/utils';

import {DEFAULT_ALIGN, DEFAULT_RESIZEABLE} from './constants';
import {b} from './shared';
import type {AlignType, Column, GetRowClassName, OnRowClick} from './types';
import {KeyboardRowContext} from './useKeyboardNavigation';
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

interface LoadingTableRowProps<T> {
    columns: Column<T>[];
    height: number;
}

export const LoadingTableRow = typedMemo(function <T>({columns, height}: LoadingTableRowProps<T>) {
    return (
        <tr className={b('row', {loading: true})} style={{height}}>
            {columns.map((column) => {
                const resizeable = column.resizeable ?? DEFAULT_RESIZEABLE;

                return (
                    <TableRowCell
                        key={column.name}
                        height={height}
                        width={column.width}
                        align={column.align}
                        className={column.className}
                        resizeable={resizeable}
                    >
                        <Skeleton
                            className={b('row-skeleton')}
                            style={{width: '80%', height: '50%'}}
                        />
                    </TableRowCell>
                );
            })}
        </tr>
    );
});

interface TableRowProps<T> {
    columns: Column<T>[];
    row: T;
    rowIndex?: number;
    height: number;
    getRowClassName?: GetRowClassName<T>;
    onRowClick?: OnRowClick<T>;
}

const TableRowCells = typedMemo(function TableRowCells<T>({
    columns,
    row,
    height,
}: Pick<TableRowProps<T>, 'columns' | 'row' | 'height'>) {
    return (
        <React.Fragment>
            {columns.map((column) => {
                const resizeable = column.resizeable ?? DEFAULT_RESIZEABLE;

                return (
                    <TableRowCell
                        key={column.name}
                        height={height}
                        width={column.width}
                        align={column.align}
                        className={column.className}
                        resizeable={resizeable}
                    >
                        {column.render({row})}
                    </TableRowCell>
                );
            })}
        </React.Fragment>
    );
});

const TableRowView = typedMemo(function TableRowView<T>({
    row,
    rowIndex,
    columns,
    getRowClassName,
    height,
    onRowClick,
    keyboardFocused,
}: TableRowProps<T> & {keyboardFocused: boolean}) {
    const additionalClassName = [
        getRowClassName?.(row),
        keyboardFocused ? KEYBOARD_FOCUSED_ROW_CLASS_NAME : undefined,
    ]
        .filter(Boolean)
        .join(' ');
    const rowClickable = typeof onRowClick === 'function';

    const handleClick: React.MouseEventHandler<HTMLTableRowElement> = (event) => {
        if (!rowClickable || event.defaultPrevented) {
            return;
        }

        onRowClick?.(row, event);
    };

    return (
        <tr
            className={b('row', {clickable: rowClickable}, additionalClassName)}
            style={{height}}
            data-row-index={rowIndex}
            aria-selected={keyboardFocused || undefined}
            onClick={rowClickable ? handleClick : undefined}
        >
            <TableRowCells columns={columns} row={row} height={height} />
        </tr>
    );
});

export function TableRow<T>(props: TableRowProps<T>) {
    const focusedIndex = React.useContext(KeyboardRowContext);
    const keyboardFocused = props.rowIndex !== undefined && props.rowIndex === focusedIndex;

    return <TableRowView {...props} keyboardFocused={keyboardFocused} />;
}

interface EmptyTableRowProps<T> {
    columns: Column<T>[];
    children?: React.ReactNode;
    height: number;
}

export const EmptyTableRow = <T,>({columns, children, height}: EmptyTableRowProps<T>) => {
    return (
        <tr className={b('row', {empty: true})} style={{height}}>
            <td colSpan={columns.length} className={b('td')}>
                {children}
            </td>
        </tr>
    );
};
