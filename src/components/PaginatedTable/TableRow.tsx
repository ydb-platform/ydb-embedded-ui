import {Skeleton} from '@gravity-ui/uikit';

import {DEFAULT_ALIGN, DEFAULT_RESIZEABLE} from './constants';
import {b} from './shared';
import type {AlignType, Column, GetRowClassName} from './types';

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
    index: number;
    height: number;
}

export const LoadingTableRow = <T,>({index, columns, height}: LoadingTableRowProps<T>) => {
    return (
        <tr className={b('row', {loading: true})}>
            {columns.map((column) => {
                const resizeable = column.resizeable ?? DEFAULT_RESIZEABLE;

                return (
                    <TableRowCell
                        key={`${column.name}${index}`}
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
};

interface TableRowProps<T> {
    columns: Column<T>[];
    index: number;
    row: T;
    height: number;
    getRowClassName?: GetRowClassName<T>;
}

export const TableRow = <T,>({row, index, columns, getRowClassName, height}: TableRowProps<T>) => {
    const additionalClassName = getRowClassName?.(row);

    return (
        <tr className={b('row', additionalClassName)}>
            {columns.map((column) => {
                const resizeable = column.resizeable ?? DEFAULT_RESIZEABLE;

                return (
                    <TableRowCell
                        key={`${column.name}${index}`}
                        height={height}
                        width={column.width}
                        align={column.align}
                        className={column.className}
                        resizeable={resizeable}
                    >
                        {column.render({row, index})}
                    </TableRowCell>
                );
            })}
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
