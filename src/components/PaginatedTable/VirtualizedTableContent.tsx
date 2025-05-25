import React from 'react';

import {ResponseError} from '../Errors/ResponseError';

import {EmptyTableRow} from './TableRow';
import {VirtualizedRow} from './VirtualizedRow';
import i18n from './i18n';
import type {Column, GetRowClassName, RenderEmptyDataMessage, RenderErrorMessage} from './types';

interface VirtualizedTableContentProps<T> {
    columns: Column<T>[];
    rowData: T[];
    isLoading: boolean;
    error: any;
    virtualRows: {index: number; top: number}[];
    totalHeight: number;
    rowHeight: number;
    getRowClassName?: GetRowClassName<T>;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    renderErrorMessage?: RenderErrorMessage;
    chunkSize?: number;
    loadingChunks?: Set<number>;
}

/**
 * Component for rendering virtualized table content
 * This component handles rendering virtualized rows, loading states, and error states
 */
export const VirtualizedTableContent = <T,>({
    columns,
    rowData,
    isLoading,
    error,
    virtualRows,
    totalHeight,
    rowHeight,
    getRowClassName,
    renderEmptyDataMessage,
    renderErrorMessage,
    chunkSize = 20,
    loadingChunks = new Set(),
}: VirtualizedTableContentProps<T>) => {
    if (isLoading && !rowData.length) {
        // Show loading state
        return (
            <tbody style={{position: 'relative'}}>
                {Array.from({length: Math.min(chunkSize, 10)}).map((_, index) => (
                    <VirtualizedRow
                        key={index}
                        index={index}
                        top={index * rowHeight}
                        columns={columns}
                        rowHeight={rowHeight}
                        isLoading={true}
                    />
                ))}
            </tbody>
        );
    }

    if (error) {
        // Show error state
        return (
            <tbody>
                <EmptyTableRow columns={columns}>
                    {renderErrorMessage ? (
                        renderErrorMessage(error)
                    ) : (
                        <ResponseError error={error} />
                    )}
                </EmptyTableRow>
            </tbody>
        );
    }

    if (!rowData.length) {
        // Show empty state
        return (
            <tbody>
                <EmptyTableRow columns={columns}>
                    {renderEmptyDataMessage ? renderEmptyDataMessage() : i18n('empty')}
                </EmptyTableRow>
            </tbody>
        );
    }

    // Create a tbody with proper table structure for virtualized rows
    // Add a spacer row to create the correct scroll height for Safari
    return (
        <tbody style={{position: 'relative'}}>
            {/* Spacer row to create the correct scroll height */}
            <tr style={{height: `${totalHeight}px`, visibility: 'hidden'}}>
                <td colSpan={columns.length} style={{padding: 0, border: 'none'}} />
            </tr>

            {virtualRows.map((virtualRow) => {
                const rowIndex = virtualRow.index;
                const chunkIndex = Math.floor(rowIndex / chunkSize);

                // Check if this chunk is currently loading
                if (loadingChunks.has(chunkIndex)) {
                    return (
                        <VirtualizedRow
                            key={rowIndex}
                            index={rowIndex}
                            top={virtualRow.top}
                            columns={columns}
                            rowHeight={rowHeight}
                            isLoading={true}
                        />
                    );
                }

                const dataIndex = rowIndex % rowData.length;

                // Check if we have data for this row
                if (dataIndex >= rowData.length) {
                    return null;
                }

                const row = rowData[dataIndex];

                return (
                    <VirtualizedRow
                        key={rowIndex}
                        row={row}
                        index={rowIndex}
                        top={virtualRow.top}
                        columns={columns}
                        rowHeight={rowHeight}
                        getRowClassName={getRowClassName}
                    />
                );
            })}
        </tbody>
    );
};
