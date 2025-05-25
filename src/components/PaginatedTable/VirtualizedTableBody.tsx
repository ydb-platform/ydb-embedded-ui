import React from 'react';

import {ResponseError} from '../Errors/ResponseError';

import {LoadingTableRow, TableRow} from './TableRow';
import i18n from './i18n';
import {b} from './shared';
import type {Column, GetRowClassName, RenderEmptyDataMessage, RenderErrorMessage} from './types';

interface VirtualizedTableBodyProps<T> {
    columns: Column<T>[];
    dataMap: Map<number, T>;
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
    bodyRef: React.RefObject<HTMLDivElement>;
}

/**
 * Virtualized table body component that uses div elements for proper layout
 * This component handles rendering virtualized rows, loading states, and error states
 * while maintaining perfect column alignment with the fixed header
 */
export const VirtualizedTableBody = <T,>({
    columns,
    dataMap,
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
    bodyRef,
}: VirtualizedTableBodyProps<T>) => {
    if (isLoading && dataMap.size === 0) {
        // Show loading state
        return (
            <div ref={bodyRef} className={b('body-container')}>
                <div className={b('body-content')} style={{height: `${totalHeight}px`}}>
                    {Array.from({length: Math.min(chunkSize, 10)}).map((_, index) => (
                        <LoadingTableRow
                            key={index}
                            columns={columns}
                            height={rowHeight}
                            data-index={index}
                            top={index * rowHeight}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        // Show error state
        return (
            <div ref={bodyRef} className={b('body-container')}>
                <div className={b('body-content', {error: true})}>
                    <div className={b('error-row')}>
                        {renderErrorMessage ? (
                            renderErrorMessage(error)
                        ) : (
                            <ResponseError error={error} />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (dataMap.size === 0) {
        // Show empty state
        return (
            <div ref={bodyRef} className={b('body-container')}>
                <div className={b('body-content', {empty: true})}>
                    <div className={b('empty-row')}>
                        {renderEmptyDataMessage ? renderEmptyDataMessage() : i18n('empty')}
                    </div>
                </div>
            </div>
        );
    }

    // Render virtualized rows
    return (
        <div ref={bodyRef} className={b('body-container')}>
            <div className={b('body-content')} style={{height: `${totalHeight}px`}}>
                {virtualRows.map((virtualRow) => {
                    const rowIndex = virtualRow.index;
                    const chunkIndex = Math.floor(rowIndex / chunkSize);

                    // Check if this chunk is currently loading
                    if (loadingChunks.has(chunkIndex)) {
                        return (
                            <LoadingTableRow
                                key={rowIndex}
                                columns={columns}
                                height={rowHeight}
                                data-index={rowIndex}
                                top={virtualRow.top}
                            />
                        );
                    }

                    // Direct lookup in the sparse data map
                    const row = dataMap.get(rowIndex);

                    // If we don't have data for this row, don't render it
                    if (!row) {
                        return null;
                    }

                    return (
                        <TableRow
                            key={rowIndex}
                            row={row}
                            columns={columns}
                            height={rowHeight}
                            getRowClassName={getRowClassName}
                            data-index={rowIndex}
                            top={virtualRow.top}
                        />
                    );
                })}
            </div>
        </div>
    );
};
