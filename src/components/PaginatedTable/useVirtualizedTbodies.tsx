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
        // Calculate which chunks contain visible rows
        const totalChunks = Math.ceil(totalItems / chunkSize);
        const startChunk = Math.max(0, Math.floor(startRow / chunkSize));
        const endChunk = Math.min(totalChunks - 1, Math.floor(endRow / chunkSize));

        // Collect active chunks
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

        const activeChunksTopOffset = startRow * rowHeight;

        return (
            <tbody
                style={{
                    position: 'absolute',
                    transform: `translateY(${activeChunksTopOffset}px)`,
                    willChange: 'transform',
                }}
            >
                {activeChunkElements}
            </tbody>
        );
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
