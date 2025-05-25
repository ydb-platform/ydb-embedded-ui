import React from 'react';

import {FixedTableHeader} from './FixedTableHeader';
import {VirtualizedTableBody} from './VirtualizedTableBody';
import {b} from './shared';
import type {
    Column,
    GetRowClassName,
    HandleTableColumnsResize,
    OnSort,
    RenderEmptyDataMessage,
    RenderErrorMessage,
} from './types';

interface VirtualizedTableContainerProps<T> {
    columns: Column<T>[];
    dataMap: Map<number, T>;
    isLoading: boolean;
    error: any;
    virtualRows: {index: number; top: number}[];
    totalHeight: number;
    rowHeight: number;
    onSort?: OnSort;
    onColumnsResize?: HandleTableColumnsResize;
    getRowClassName?: GetRowClassName<T>;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    renderErrorMessage?: RenderErrorMessage;
    chunkSize?: number;
    loadingChunks?: Set<number>;
}

/**
 * Main virtualized table container that implements the hybrid table-div architecture
 * This component coordinates between the fixed header table and virtualized body
 */
export const VirtualizedTableContainer = <T,>({
    columns,
    dataMap,
    isLoading,
    error,
    virtualRows,
    totalHeight,
    rowHeight,
    onSort,
    onColumnsResize,
    getRowClassName,
    renderEmptyDataMessage,
    renderErrorMessage,
    chunkSize,
    loadingChunks,
}: VirtualizedTableContainerProps<T>) => {
    const bodyRef = React.useRef<HTMLDivElement>(null);
    console.log(columns);

    return (
        <div className={b('container')}>
            {/* Fixed header table */}
            <FixedTableHeader columns={columns} onSort={onSort} onColumnsResize={onColumnsResize} />

            {/* Virtualized body container */}
            <VirtualizedTableBody
                columns={columns}
                dataMap={dataMap}
                isLoading={isLoading}
                error={error}
                virtualRows={virtualRows}
                totalHeight={totalHeight}
                rowHeight={rowHeight}
                getRowClassName={getRowClassName}
                renderEmptyDataMessage={renderEmptyDataMessage}
                renderErrorMessage={renderErrorMessage}
                chunkSize={chunkSize}
                loadingChunks={loadingChunks}
                bodyRef={bodyRef}
            />
        </div>
    );
};
