import {Skeleton} from '@gravity-ui/uikit';

import {DEFAULT_ALIGN} from './constants';
import {b} from './shared';
import type {AlignType, Column, GetRowClassName} from './types';
import {typedMemo} from './utils';

interface VirtualCellProps {
    height: number;
    width: number;
    align?: AlignType;
    children: React.ReactNode;
    className?: string;
}

const VirtualCell = ({
    children,
    className,
    height,
    width,
    align = DEFAULT_ALIGN,
}: VirtualCellProps) => {
    return (
        <div
            className={b('virtual-cell', {align: align}, className)}
            style={{
                height: `${height}px`,
                width: `${width}px`,
                minWidth: `${width}px`,
            }}
        >
            {children}
        </div>
    );
};

interface LoadingTableRowProps<T> {
    columns: Column<T>[];
    height: number;
    'data-index'?: number;
    top: number;
}

export const LoadingTableRow = typedMemo(function <T>({
    columns,
    height,
    'data-index': dataIndex,
    top,
}: LoadingTableRowProps<T>) {
    return (
        <div
            className={b('virtual-row', {loading: true})}
            style={{transform: `translateY(${top}px)`, height}}
            data-index={dataIndex}
        >
            {columns.map((column) => {
                const width = column.width || 150;

                return (
                    <VirtualCell
                        key={column.name}
                        height={height}
                        width={width}
                        align={column.align}
                        className={column.className}
                    >
                        <Skeleton
                            className={b('row-skeleton')}
                            style={{width: '80%', height: '50%'}}
                        />
                    </VirtualCell>
                );
            })}
        </div>
    );
});

interface TableRowProps<T> {
    columns: Column<T>[];
    row: T;
    height: number;
    getRowClassName?: GetRowClassName<T>;
    'data-index'?: number;
    top: number;
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
    return (
        <div
            className={b('virtual-row', additionalClassName)}
            style={{transform: `translateY(${top}px)`, height}}
            data-index={dataIndex}
        >
            {columns.map((column) => {
                const width = column.width || 150;

                return (
                    <VirtualCell
                        key={column.name}
                        height={height}
                        width={width}
                        align={column.align}
                        className={column.className}
                    >
                        {column.render({row})}
                    </VirtualCell>
                );
            })}
        </div>
    );
};

interface EmptyTableRowProps {
    children?: React.ReactNode;
    'data-index'?: number;
    height: number;
    top: number;
}

export const EmptyTableRow = ({
    children,
    'data-index': dataIndex,
    top,
    height,
}: EmptyTableRowProps) => {
    return (
        <div
            className={b('virtual-row', {empty: true})}
            style={{transform: `translateY(${top}px)`, height}}
            data-index={dataIndex}
        >
            <div className={b('virtual-cell', {empty: true})} style={{width: '100%'}}>
                {children}
            </div>
        </div>
    );
};
