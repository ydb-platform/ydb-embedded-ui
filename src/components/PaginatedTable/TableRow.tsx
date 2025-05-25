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

interface LoadingTableRowProps<T> {
    columns: Column<T>[];
    height: number;
    'data-index'?: number;
    top?: number;
}

export const LoadingTableRow = typedMemo(function <T>({
    columns,
    height,
    'data-index': dataIndex,
    top,
}: LoadingTableRowProps<T>) {
    const style = top !== undefined ? {transform: `translateY(${top}px)`} : undefined;

    return (
        <tr className={b('row', {loading: true})} style={style} data-index={dataIndex}>
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
    height: number;
    getRowClassName?: GetRowClassName<T>;
    'data-index'?: number;
    top?: number;
}

export const TableRow = <T,>({
    row,
    columns,
    getRowClassName,
    height,
    'data-index': dataIndex,
    top,
}: TableRowProps<T>) => {
    const additionalClassName = getRowClassName?.(row);
    const style = top !== undefined ? {transform: `translateY(${top}px)`} : undefined;

    return (
        <tr className={b('row', additionalClassName)} style={style} data-index={dataIndex}>
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
        </tr>
    );
};

interface EmptyTableRowProps<T> {
    columns: Column<T>[];
    children?: React.ReactNode;
    'data-index'?: number;
    top?: number;
}

export const EmptyTableRow = <T,>({
    columns,
    children,
    'data-index': dataIndex,
    top,
}: EmptyTableRowProps<T>) => {
    const style = top !== undefined ? {transform: `translateY(${top}px)`} : undefined;

    return (
        <tr className={b('row', {empty: true})} style={style} data-index={dataIndex}>
            <td colSpan={columns.length} className={b('td')}>
                {children}
            </td>
        </tr>
    );
};
