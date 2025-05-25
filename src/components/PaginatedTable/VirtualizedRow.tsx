import React from 'react';

import {EmptyTableRow, LoadingTableRow, TableRow} from './TableRow';
import type {Column, GetRowClassName} from './types';

interface VirtualizedRowProps<T> {
    row?: T;
    index: number;
    top: number;
    columns: Column<T>[];
    rowHeight: number;
    getRowClassName?: GetRowClassName<T>;
    isLoading?: boolean;
    emptyContent?: React.ReactNode;
}

/**
 * A wrapper component that adds virtualization to TableRow, LoadingTableRow, or EmptyTableRow
 * This component handles absolute positioning and can render data rows, loading skeletons, or empty rows
 */
export const VirtualizedRow = <T,>({
    row,
    index,
    top,
    columns,
    rowHeight,
    getRowClassName,
    isLoading = false,
    emptyContent,
}: VirtualizedRowProps<T>) => {
    // Render loading skeleton
    if (isLoading) {
        return (
            <LoadingTableRow columns={columns} height={rowHeight} data-index={index} top={top} />
        );
    }

    // For data rows, row is required
    if (!row) {
        return (
            <EmptyTableRow columns={columns} data-index={index} top={top}>
                {emptyContent}
            </EmptyTableRow>
        );
    }

    return (
        <TableRow
            row={row}
            columns={columns}
            height={rowHeight}
            getRowClassName={getRowClassName}
            data-index={index}
            top={top}
        />
    );
};
