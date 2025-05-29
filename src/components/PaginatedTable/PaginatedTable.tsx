import React from 'react';

import {usePaginatedTableState} from './PaginatedTableContext';
import {TableChunk} from './TableChunk';
import {TableHead} from './TableHead';
import {DEFAULT_TABLE_ROW_HEIGHT} from './constants';
import {b} from './shared';
import type {
    Column,
    FetchData,
    GetRowClassName,
    HandleTableColumnsResize,
    PaginatedTableData,
    RenderEmptyDataMessage,
    RenderErrorMessage,
} from './types';
import {useScrollBasedChunks} from './useScrollBasedChunks';
import {calculateElementOffsetTop} from './utils';

import './PaginatedTable.scss';

export interface PaginatedTableProps<T, F> {
    limit?: number;
    initialEntitiesCount?: number;
    fetchData: FetchData<T, F>;
    filters?: F;
    tableName: string;
    columns: Column<T>[];
    getRowClassName?: GetRowClassName<T>;
    rowHeight?: number;
    scrollContainerRef: React.RefObject<HTMLElement>;
    onColumnsResize?: HandleTableColumnsResize;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    renderErrorMessage?: RenderErrorMessage;
    containerClassName?: string;
    onDataFetched?: (data: PaginatedTableData<T>) => void;
    keepCache?: boolean;
}

const DEFAULT_PAGINATION_LIMIT = 10;

export const PaginatedTable = <T, F>({
    limit: chunkSize = DEFAULT_PAGINATION_LIMIT,
    initialEntitiesCount,
    fetchData,
    filters: rawFilters,
    tableName,
    columns,
    getRowClassName,
    rowHeight = DEFAULT_TABLE_ROW_HEIGHT,
    scrollContainerRef,
    onColumnsResize,
    renderErrorMessage,
    renderEmptyDataMessage,
    containerClassName,
    onDataFetched,
    keepCache = true,
}: PaginatedTableProps<T, F>) => {
    // Get state and setters from context
    const {tableState, setSortParams, setTotalEntities, setFoundEntities, setIsInitialLoad} =
        usePaginatedTableState();

    const {sortParams, foundEntities} = tableState;

    const tableRef = React.useRef<HTMLDivElement>(null);
    const [tableOffset, setTableOffset] = React.useState(0);

    const chunkStates = useScrollBasedChunks({
        scrollContainerRef,
        tableRef,
        totalItems: foundEntities,
        rowHeight,
        chunkSize,
        tableOffset,
    });

    // this prevent situation when filters are new, but active chunks is not yet recalculated (it will be done to the next rendrer, so we bring filters change on the next render too)
    const [filters, setFilters] = React.useState(rawFilters);

    React.useEffect(() => {
        setFilters(rawFilters);
    }, [rawFilters]);

    const lastChunkSize = React.useMemo(() => {
        // If foundEntities = 0, there will only first chunk
        // Display it with 1 row, to display empty data message
        if (!foundEntities) {
            return 1;
        }
        return foundEntities % chunkSize || chunkSize;
    }, [foundEntities, chunkSize]);

    const handleDataFetched = React.useCallback(
        (data?: PaginatedTableData<T>) => {
            if (data) {
                setTotalEntities(data.total);
                setFoundEntities(data.found);
                setIsInitialLoad(false);
                onDataFetched?.(data);
            }
        },
        [onDataFetched, setFoundEntities, setIsInitialLoad, setTotalEntities],
    );

    React.useLayoutEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        const table = tableRef.current;
        if (table && scrollContainer) {
            setTableOffset(calculateElementOffsetTop(table, scrollContainer));
        }
    }, [scrollContainerRef.current, tableRef.current, foundEntities]);

    // Set will-change: transform on scroll container if not already set
    React.useLayoutEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            const computedStyle = window.getComputedStyle(scrollContainer);
            if (computedStyle.willChange !== 'transform') {
                scrollContainer.style.willChange = 'transform';
            }
        }
    }, [scrollContainerRef.current]);

    // Reset table on initialization and filters change
    React.useLayoutEffect(() => {
        const defaultTotal = initialEntitiesCount || 0;
        const defaultFound = initialEntitiesCount || 1;

        setTotalEntities(defaultTotal);
        setFoundEntities(defaultFound);
        setIsInitialLoad(true);
    }, [initialEntitiesCount, setTotalEntities, setFoundEntities, setIsInitialLoad]);

    const renderChunks = () => {
        const chunks: React.ReactElement[] = [];
        let i = 0;

        while (i < chunkStates.length) {
            const chunkState = chunkStates[i];
            const shouldRender = chunkState.shouldRender;
            const shouldFetch = chunkState.shouldFetch;
            const isActive = shouldRender || shouldFetch;

            if (isActive) {
                chunks.push(
                    <TableChunk<T, F>
                        key={i}
                        id={i}
                        calculatedCount={i === chunkStates.length - 1 ? lastChunkSize : chunkSize}
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
                        onDataFetched={handleDataFetched}
                        shouldFetch={chunkState.shouldFetch}
                        shouldRender={chunkState.shouldRender}
                        keepCache={keepCache}
                    />,
                );
            }

            if (shouldRender) {
                i++;
            } else {
                // Find consecutive inactive chunks and merge them
                const startIndex = i;
                let totalHeight = 0;

                while (i < chunkStates.length && !chunkStates[i].shouldRender) {
                    const currentChunkSize =
                        i === chunkStates.length - 1 ? lastChunkSize : chunkSize;
                    totalHeight += currentChunkSize * rowHeight;
                    i++;
                }

                // Render merged separator for consecutive inactive chunks
                chunks.push(
                    <tr
                        style={{height: `${totalHeight}px`}}
                        key={`separator-${startIndex}-${i - 1}`}
                    >
                        <td colSpan={columns.length} style={{padding: 0, border: 'none'}} />
                    </tr>,
                );
            }
        }

        return chunks;
    };

    const renderTable = () => (
        <table className={b('table')}>
            <TableHead columns={columns} onSort={setSortParams} onColumnsResize={onColumnsResize} />
            <tbody>{renderChunks()}</tbody>
        </table>
    );

    return (
        <div ref={tableRef} className={b(null, containerClassName)}>
            {renderTable()}
        </div>
    );
};
