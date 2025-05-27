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
    activeChunks: boolean[];
    chunkSize: number;
    lastChunkSize: number;
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
    activeChunks,
    chunkSize,
    lastChunkSize,
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
    // Reusable spacer tbody elements (max 2: before and after active chunks)
    const beforeSpacerRef = React.useRef<HTMLTableSectionElement>(null);
    const afterSpacerRef = React.useRef<HTMLTableSectionElement>(null);

    const renderChunks = React.useCallback(() => {
        const chunks: React.ReactElement[] = [];

        // Count empty start chunks
        let startEmptyCount = 0;
        while (startEmptyCount < activeChunks.length && !activeChunks[startEmptyCount]) {
            startEmptyCount++;
        }

        // Push start spacer if needed
        if (startEmptyCount > 0) {
            chunks.push(
                <tbody
                    key="spacer-start"
                    ref={beforeSpacerRef}
                    style={{
                        height: `${startEmptyCount * chunkSize * rowHeight}px`,
                        display: 'block',
                    }}
                />,
            );
        }

        // Collect active chunks and calculate total height
        const activeChunkElements: React.ReactElement[] = [];
        let totalActiveHeight = 0;

        for (let i = startEmptyCount; i < activeChunks.length && activeChunks[i]; i++) {
            const chunkRowCount = i === activeChunks.length - 1 ? lastChunkSize : chunkSize;
            totalActiveHeight += chunkRowCount * rowHeight;

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
                />,
            );
            startEmptyCount = i + 1;
        }

        // Wrap active chunks in a single tbody with calculated height
        if (activeChunkElements.length > 0) {
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

        // Count empty end chunks
        const endEmptyCount = activeChunks.length - startEmptyCount;

        // Push end spacer if needed
        if (endEmptyCount > 0) {
            chunks.push(
                <tbody
                    key="spacer-end"
                    ref={afterSpacerRef}
                    style={{
                        height: `${endEmptyCount * chunkSize * rowHeight}px`,
                        display: 'block',
                    }}
                />,
            );
        }

        return chunks;
    }, [
        activeChunks,
        chunkSize,
        lastChunkSize,
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
