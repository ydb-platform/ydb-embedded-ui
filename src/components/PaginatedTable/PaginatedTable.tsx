import React from 'react';

import {usePaginatedTableState} from './PaginatedTableContext';
import {TableHead} from './TableHead';
import {VirtualizedTableContent} from './VirtualizedTableContent';
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
import {useChunkFetcher} from './useChunkFetcher';
import {useVirtualRows} from './useVirtualRows';

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
    const [filters, setFilters] = React.useState(rawFilters);

    // Update filters when they change
    React.useEffect(() => {
        setFilters(rawFilters);
    }, [rawFilters]);

    // Reset table on filters change
    React.useLayoutEffect(() => {
        const defaultTotal = initialEntitiesCount || 0;
        const defaultFound = initialEntitiesCount || 1;

        setTotalEntities(defaultTotal);
        setFoundEntities(defaultFound);
        setIsInitialLoad(true);
    }, [initialEntitiesCount, setTotalEntities, setFoundEntities, setIsInitialLoad]);

    // Use our new virtualization hook
    const {virtualRows, totalHeight, visibleRange} = useVirtualRows({
        scrollContainerRef,
        tableRef,
        totalItems: foundEntities,
        rowHeight,
    });

    // Use our chunk fetcher hook
    const columnsIds = columns.map((column) => column.name);
    const {rowData, isLoading, error} = useChunkFetcher<T, F>({
        fetchData,
        filters,
        sortParams,
        columnsIds,
        chunkSize,
        visibleRange,
        onDataFetched: (data) => {
            setTotalEntities(data.total);
            setFoundEntities(data.found);
            setIsInitialLoad(false);
            onDataFetched?.(data);
        },
    });

    return (
        <div ref={tableRef} className={b(null, containerClassName)}>
            <table className={b('table')}>
                <TableHead
                    columns={columns}
                    onSort={setSortParams}
                    onColumnsResize={onColumnsResize}
                />
                <VirtualizedTableContent
                    columns={columns}
                    rowData={rowData}
                    isLoading={isLoading}
                    error={error}
                    virtualRows={virtualRows}
                    totalHeight={totalHeight}
                    rowHeight={rowHeight}
                    getRowClassName={getRowClassName}
                    renderEmptyDataMessage={renderEmptyDataMessage}
                    renderErrorMessage={renderErrorMessage}
                    chunkSize={chunkSize}
                />
            </table>
        </div>
    );
};
