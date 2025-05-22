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
    SortParams,
} from './types';
import {useScrollBasedChunks} from './useScrollBasedChunks';

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
    initialSortParams?: SortParams;
    onColumnsResize?: HandleTableColumnsResize;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    renderErrorMessage?: RenderErrorMessage;
    containerClassName?: string;
    onDataFetched?: (data: PaginatedTableData<T>) => void;
    keepCache?: boolean;
}

const DEFAULT_PAGINATION_LIMIT = 20;

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
    initialSortParams,
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

    // Initialize state with props if available
    React.useEffect(() => {
        if (initialSortParams) {
            setSortParams(initialSortParams);
        }

        if (initialEntitiesCount) {
            setTotalEntities(initialEntitiesCount);
            setFoundEntities(initialEntitiesCount);
        }
    }, [
        setSortParams,
        setTotalEntities,
        setFoundEntities,
        initialSortParams,
        initialEntitiesCount,
    ]);

    const tableRef = React.useRef<HTMLDivElement>(null);

    const activeChunks = useScrollBasedChunks({
        scrollContainerRef,
        tableRef,
        totalItems: foundEntities,
        rowHeight,
        chunkSize,
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

    // Reset table on filters change
    React.useLayoutEffect(() => {
        const defaultTotal = initialEntitiesCount || 0;
        const defaultFound = initialEntitiesCount || 1;

        setTotalEntities(defaultTotal);
        setFoundEntities(defaultFound);
        setIsInitialLoad(true);
    }, [initialEntitiesCount, setTotalEntities, setFoundEntities, setIsInitialLoad]);

    const renderChunks = () => {
        return activeChunks.map((isActive, index) => (
            <TableChunk<T, F>
                key={index}
                id={index}
                calculatedCount={index === activeChunks.length - 1 ? lastChunkSize : chunkSize}
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
                isActive={isActive}
                keepCache={keepCache}
            />
        ));
    };

    const renderTable = () => (
        <table className={b('table')}>
            <TableHead columns={columns} onSort={setSortParams} onColumnsResize={onColumnsResize} />
            {renderChunks()}
        </table>
    );

    return (
        <div ref={tableRef} className={b(null, containerClassName)}>
            {renderTable()}
        </div>
    );
};
