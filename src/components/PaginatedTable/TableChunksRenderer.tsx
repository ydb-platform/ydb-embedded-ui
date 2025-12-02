import React from 'react';

import {TableChunk} from './TableChunk';
import type {PaginatedTableId} from './constants';
import {b} from './shared';
import type {
    Column,
    FetchData,
    GetRowClassName,
    PaginatedTableData,
    RenderEmptyDataMessage,
    RenderErrorMessage,
    SortParams,
} from './types';
import {useScrollBasedChunks} from './useScrollBasedChunks';

export interface TableChunksRendererProps<T, F> {
    scrollContainerRef: React.RefObject<HTMLElement>;
    tableRef: React.RefObject<HTMLElement>;
    foundEntities: number;
    chunkSize: number;
    rowHeight: number;
    columns: Column<T>[];
    fetchData: FetchData<T, F>;
    filters?: F;
    tableName: PaginatedTableId;
    sortParams?: SortParams;
    getRowClassName?: GetRowClassName<T>;
    renderErrorMessage?: RenderErrorMessage;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    onDataFetched: (data?: PaginatedTableData<T>) => void;
    keepCache: boolean;
}

export const TableChunksRenderer = <T, F>({
    scrollContainerRef,
    tableRef,
    foundEntities,
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
}: TableChunksRendererProps<T, F>) => {
    const chunkStates = useScrollBasedChunks({
        scrollContainerRef,
        tableRef,
        totalItems: foundEntities || 1,
        rowHeight,
        chunkSize,
    });

    const lastChunkSize = React.useMemo(() => {
        // If foundEntities = 0, there will only first chunk
        // Display it with 1 row, to display empty data message
        if (!foundEntities) {
            return 1;
        }
        return foundEntities % chunkSize || chunkSize;
    }, [foundEntities, chunkSize]);

    const findRenderChunkRange = React.useCallback(() => {
        const firstRenderIndex = chunkStates.findIndex((state) => state.shouldRender);
        const lastRenderIndex = chunkStates.findLastIndex((state) => state.shouldRender);
        return {firstRenderIndex, lastRenderIndex};
    }, [chunkStates]);

    const findFetchChunkRange = React.useCallback(() => {
        const firstFetchIndex = chunkStates.findIndex((state) => state.shouldFetch);
        const lastFetchIndex = chunkStates.findLastIndex((state) => state.shouldFetch);
        return {firstFetchIndex, lastFetchIndex};
    }, [chunkStates]);

    const calculateSeparatorHeight = React.useCallback(
        (startIndex: number, endIndex: number) => {
            let totalHeight = 0;
            for (let i = startIndex; i < endIndex; i++) {
                const currentChunkSize = i === chunkStates.length - 1 ? lastChunkSize : chunkSize;
                totalHeight += currentChunkSize * rowHeight;
            }
            return totalHeight;
        },
        [chunkSize, chunkStates.length, lastChunkSize, rowHeight],
    );

    const createSeparator = React.useCallback(
        (startIndex: number, endIndex: number, key: string) => {
            const height = calculateSeparatorHeight(startIndex, endIndex);
            return (
                <tr style={{height: `${height}px`}} className={b(key)} key={key}>
                    <td colSpan={columns.length} style={{padding: 0, border: 'none'}} />
                </tr>
            );
        },
        [calculateSeparatorHeight, columns.length],
    );

    const createChunk = React.useCallback(
        (chunkIndex: number) => {
            const chunkState = chunkStates[chunkIndex];
            return (
                <TableChunk<T, F>
                    key={chunkIndex}
                    id={chunkIndex}
                    calculatedCount={
                        chunkIndex === chunkStates.length - 1 ? lastChunkSize : chunkSize
                    }
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
                    shouldFetch={chunkState.shouldFetch}
                    shouldRender={chunkState.shouldRender}
                    keepCache={keepCache}
                />
            );
        },
        [
            chunkSize,
            chunkStates,
            columns,
            fetchData,
            filters,
            getRowClassName,
            keepCache,
            lastChunkSize,
            onDataFetched,
            renderEmptyDataMessage,
            renderErrorMessage,
            rowHeight,
            sortParams,
            tableName,
        ],
    );

    const renderChunks = React.useCallback(() => {
        // Chunk states are distrubuted like [null, null, fetch, fetch, render+fetch, render+fetch, fetch, fetch, null, null]
        // i.e. fetched chunks include rendered chunks
        const {firstFetchIndex, lastFetchIndex} = findFetchChunkRange();
        const {firstRenderIndex, lastRenderIndex} = findRenderChunkRange();
        const elements: React.ReactElement[] = [];

        // No fetch chunks found
        if (firstFetchIndex === -1) {
            return elements;
        }

        // Beginning separator (for chunks before first render chunk)
        if (firstRenderIndex > 0) {
            elements.push(createSeparator(0, firstRenderIndex, 'separator-beginning'));
        }

        // All fetch chunks (shouldFetch = true) get rendered as TableChunk components
        for (let i = firstFetchIndex; i <= lastFetchIndex; i++) {
            elements.push(createChunk(i));
        }

        // End separator (for chunks after last render chunk)
        if (lastRenderIndex < chunkStates.length - 1) {
            elements.push(
                createSeparator(lastRenderIndex + 1, chunkStates.length, 'separator-end'),
            );
        }

        return elements;
    }, [
        chunkStates.length,
        createChunk,
        createSeparator,
        findFetchChunkRange,
        findRenderChunkRange,
    ]);

    return <React.Fragment>{renderChunks()}</React.Fragment>;
};
