import React from 'react';

import {TableRow} from './TableRow';
import type {Column, GetRowClassName} from './types';

interface VirtualizedRowProps<T> {
    row: T;
    index: number;
    top: number;
    columns: Column<T>[];
    rowHeight: number;
    getRowClassName?: GetRowClassName<T>;
    style?: React.CSSProperties;
}

/**
 * A wrapper component that adds virtualization to the existing TableRow
 * This component handles absolute positioning and DOM recycling
 */
export const VirtualizedRow = <T,>({
    row,
    index,
    top,
    columns,
    rowHeight,
    getRowClassName,
    style,
}: VirtualizedRowProps<T>) => {
    // Apply styles directly to the TableRow component
    const rowStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        transform: `translateY(${top}px)`, // Use translateY for positioning - GPU accelerated
        contain: 'layout style paint', // CSS containment for performance isolation
        willChange: 'transform', // Hint to the browser that this element will change
        ...style,
    };

    // Pass the style directly to TableRow to avoid DOM nesting issues
    return (
        <TableRow
            row={row}
            columns={columns}
            height={rowHeight}
            getRowClassName={getRowClassName}
            style={rowStyle}
            data-index={index}
        />
    );
};
