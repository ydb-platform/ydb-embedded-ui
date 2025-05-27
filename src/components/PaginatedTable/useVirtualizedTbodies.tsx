import React from 'react';

import {TableChunk} from './TableChunk';
import type {
    Column,
    FetchData,
    GetRowClassName,
    PaginatedTableData,
    RenderEmptyDataMessage,
    RenderErrorMessage,
    SortParams,
} from './types';

interface UseVirtualizedTbodiesProps<T, F> {
    visibleRowRange: {start: number; end: number};
    totalItems: number;
    chunkSize: number;
    rowHeight: number;
    columns: Column<T>[];
    fetchData: FetchData<T, F>;
    filters?: F;
    tableName: string;
    sortParams?: SortParams;
    getRowClassName?: GetRowClassName<T>;
    renderErrorMessage?: RenderErrorMessage;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    onDataFetched: (data?: PaginatedTableData<T>) => void;
    keepCache?: boolean;
}

export const useVirtualizedTbodies = <T, F>({
    visibleRowRange,
    totalItems,
    chunkSize,
    rowHeight,
    columns,
    fetchData,
    filters,
    tableName,
    sortParams,
    getRowClassName,
    renderErrorMessage,
    renderEmptyDataMessage,
    onDataFetched,
    keepCache = true,
}: UseVirtualizedTbodiesProps<T, F>) => {
    const startRow = visibleRowRange.start;
    const endRow = visibleRowRange.end;

    const renderChunks = React.useCallback(() => {
        const chunks: React.ReactElement[] = [];

        // Calculate which chunks contain visible rows
        const totalChunks = Math.ceil(totalItems / chunkSize);
        const startChunk = Math.max(0, Math.floor(startRow / chunkSize));
        const endChunk = Math.min(totalChunks - 1, Math.floor(endRow / chunkSize));

        // Push start spacer for rows before visible range
        const startSpacerHeight = startRow * rowHeight;
        if (startSpacerHeight > 0) {
            chunks.push(
                <tbody
                    key="spacer-start"
                    style={{
                        height: `${startSpacerHeight}px`,
                        display: 'block',
                    }}
                />,
            );
        }

        // Collect active chunks and calculate height for visible rows only
        const activeChunkElements: React.ReactElement[] = [];

        for (let i = startChunk; i <= endChunk; i++) {
            const chunkRowCount = i === totalChunks - 1 ? totalItems - i * chunkSize : chunkSize;

            activeChunkElements.push(
                <TableChunk<T, F>
                    key={i}
                    id={i}
                    calculatedCount={chunkRowCount}
                    chunkSize={chunkSize}
                    rowHeight={rowHeight}
                    columns={columns}
                    fetchData={fetchData}
                    filters={filters}
                    tableName={tableName}
                    sortParams={sortParams}
                    getRowClassName={getRowClassName}
                    renderErrorMessage={renderErrorMessage}
                    renderEmptyDataMessage={renderEmptyDataMessage}
                    onDataFetched={onDataFetched}
                    keepCache={keepCache}
                    startRow={startRow}
                    endRow={endRow}
                />,
            );
        }

        // Wrap active chunks in a single tbody
        if (activeChunkElements.length > 0) {
            // Calculate height based on visible rows only
            const visibleRowCount = endRow - startRow + 1;
            const totalActiveHeight = visibleRowCount * rowHeight;

            chunks.push(
                <tbody
                    key="active-chunks"
                    style={{
                        height: `${totalActiveHeight}px`,
                        display: 'table-row-group',
                    }}
                >
                    {activeChunkElements}
                </tbody>,
            );
        }

        // Add end spacer for rows after visible range
        const endSpacerHeight = Math.max(0, (totalItems - startRow - 1) * rowHeight);

        if (endSpacerHeight > 0) {
            chunks.push(
                <tbody
                    key="spacer-end"
                    style={{
                        height: `${endSpacerHeight}px`,
                        display: 'block',
                    }}
                />,
            );
        }

        return chunks;
    }, [
        startRow,
        endRow,
        totalItems,
        chunkSize,
        rowHeight,
        columns,
        fetchData,
        filters,
        tableName,
        sortParams,
        getRowClassName,
        renderErrorMessage,
        renderEmptyDataMessage,
        onDataFetched,
        keepCache,
    ]);

    return {renderChunks};
};
