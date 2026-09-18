import React from 'react';

import isEqual from 'lodash/isEqual';
import {useStore} from 'react-redux';

import type {RootState} from '../../store';
import {tableDataApi} from '../../store/reducers/tableData';

import {KeyboardNavigation} from './KeyboardNavigation';
import {usePaginatedTableState} from './PaginatedTableContext';
import {TableChunksRenderer} from './TableChunksRenderer';
import {TableHead} from './TableHead';
import type {PaginatedTableId} from './constants';
import {DEFAULT_TABLE_ROW_HEIGHT} from './constants';
import {getTableChunkQueryParams} from './getTableChunkQueryParams';
import {b} from './shared';
import type {
    Column,
    FetchData,
    GetRowClassName,
    HandleTableColumnsResize,
    OnRowClick,
    PaginatedTableData,
    RenderEmptyDataMessage,
    RenderErrorMessage,
} from './types';
import {isSortColumnAvailable} from './utils';

import './PaginatedTable.scss';

export interface PaginatedTableProps<T, F> {
    limit?: number;
    initialEntitiesCount?: number;
    fetchData: FetchData<T, F>;
    filters?: F;
    tableName: PaginatedTableId;
    columns: Column<T>[];
    getRowClassName?: GetRowClassName<T>;
    onRowClick?: OnRowClick<T>;
    rowHeight?: number;
    scrollContainerRef: React.RefObject<HTMLElement>;
    onColumnsResize?: HandleTableColumnsResize;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    renderErrorMessage?: RenderErrorMessage;
    containerClassName?: string;
    onDataFetched?: (data: PaginatedTableData<T>) => void;
    keepCache?: boolean;
    fetchOverscan?: number;
    onKeyboardActivate?: (row: T) => void;
    getKeyboardRowKey?: (row: T) => string | number | undefined;
    getKeyboardRowLabel?: (row: T) => string | undefined;
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
    onRowClick,
    rowHeight = DEFAULT_TABLE_ROW_HEIGHT,
    scrollContainerRef,
    onColumnsResize,
    renderErrorMessage,
    renderEmptyDataMessage,
    containerClassName,
    onDataFetched,
    keepCache = true,
    fetchOverscan,
    onKeyboardActivate,
    getKeyboardRowKey,
    getKeyboardRowLabel,
}: PaginatedTableProps<T, F>) => {
    const store = useStore<RootState>();
    // Get state and setters from context
    const {
        tableState,
        noBatching,
        setSortParams,
        setTotalEntities,
        setFoundEntities,
        setIsInitialLoad,
    } = usePaginatedTableState();

    const {sortParams, foundEntities} = tableState;
    const activeSortParams = isSortColumnAvailable(sortParams, columns) ? sortParams : undefined;

    const tableRef = React.useRef<HTMLDivElement>(null);

    // this prevent situation when filters are new, but active chunks is not yet recalculated (it will be done to the next rendrer, so we bring filters change on the next render too)
    const [filters, setFilters] = React.useState(rawFilters);

    React.useEffect(() => {
        setFilters(rawFilters);
    }, [rawFilters]);

    const getQueryParams = (offset: number) =>
        getTableChunkQueryParams({
            offset,
            limit: chunkSize,
            fetchData,
            filters: rawFilters,
            sortParams: activeSortParams,
            columns,
            tableName,
            noBatching,
        });

    const getRow = (index: number) => {
        const offset = Math.floor(index / chunkSize) * chunkSize;
        const queryParams = getQueryParams(offset);
        const {data} = tableDataApi.endpoints.fetchTableChunk.select(queryParams)(store.getState());
        return data?.data[index - offset] as T | undefined;
    };

    const getRowKey = (index: number) => {
        const row = getRow(index);
        return row === undefined ? undefined : getKeyboardRowKey?.(row);
    };

    const getRowLabel = (index: number) => {
        const row = getRow(index);
        return row === undefined ? undefined : getKeyboardRowLabel?.(row);
    };

    const findRowIndex = (key: string | number, previousIndex: number) => {
        if (getRowKey(previousIndex) === key) {
            return previousIndex;
        }
        const state = store.getState();
        const queryParams = getQueryParams(0);
        const cachedArgs = tableDataApi.util.selectCachedArgsForQuery(state, 'fetchTableChunk');
        for (const args of cachedArgs) {
            if (
                !isEqual(
                    {...args, offset: 0, fetchData: undefined},
                    {...queryParams, fetchData: undefined},
                )
            ) {
                continue;
            }
            const {data} = tableDataApi.endpoints.fetchTableChunk.select(args)(state);
            const index = data?.data.findIndex((row) => getKeyboardRowKey?.(row as T) === key);
            if (index !== undefined && index >= 0) {
                return args.offset + index;
            }
        }
        return undefined;
    };

    const activateRow = (index: number) => {
        const row = getRow(index);
        if (row !== undefined) {
            onKeyboardActivate?.(row);
        }
    };

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
                    chunkSize={chunkSize}
                    rowHeight={rowHeight}
                    columns={columns}
                    fetchData={fetchData}
                    filters={filters}
                    tableName={tableName}
                    sortParams={activeSortParams}
                    getRowClassName={getRowClassName}
                    onRowClick={onRowClick}
                    renderErrorMessage={renderErrorMessage}
                    renderEmptyDataMessage={renderEmptyDataMessage}
                    onDataFetched={handleDataFetched}
                    keepCache={keepCache}
                    fetchOverscan={fetchOverscan}
                />
            </tbody>
        </table>
    );

    return (
        <KeyboardNavigation
            tableRef={tableRef}
            scrollContainerRef={scrollContainerRef}
            onActivate={onKeyboardActivate ? activateRow : undefined}
            getRowKey={getKeyboardRowKey ? getRowKey : undefined}
            getRowLabel={getKeyboardRowLabel ? getRowLabel : undefined}
            findRowIndex={getKeyboardRowKey ? findRowIndex : undefined}
            subscribe={store.subscribe}
            rowCount={foundEntities}
            rowHeight={rowHeight}
            filters={rawFilters}
            sortParams={activeSortParams}
            className={b(null, containerClassName)}
        >
            {renderTable()}
        </KeyboardNavigation>
    );
};
