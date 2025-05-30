import React from 'react';

import {usePaginatedTableState} from './PaginatedTableContext';
import {TableChunksRenderer} from './TableChunksRenderer';
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

    // this prevent situation when filters are new, but active chunks is not yet recalculated (it will be done to the next rendrer, so we bring filters change on the next render too)
    const [filters, setFilters] = React.useState(rawFilters);

    React.useEffect(() => {
        setFilters(rawFilters);
    }, [rawFilters]);

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

    const renderTable = () => (
        <table className={b('table')}>
            <TableHead columns={columns} onSort={setSortParams} onColumnsResize={onColumnsResize} />
            <tbody>
                <TableChunksRenderer
                    scrollContainerRef={scrollContainerRef}
                    tableRef={tableRef}
                    foundEntities={foundEntities}
                    tableOffset={tableOffset}
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
                    keepCache={keepCache}
                />
            </tbody>
        </table>
    );

    return (
        <div ref={tableRef} className={b(null, containerClassName)}>
            {renderTable()}
        </div>
    );
};
