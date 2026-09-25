import React from 'react';

import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
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
import {getChunkLookupRevision, isChunkLookupPending} from './rowLookup';
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
    const {tableState, noBatching, setSortParams, dispatchCounts} = usePaginatedTableState();

    const {sortParams, foundEntities} = tableState;
    const activeSortParams = isSortColumnAvailable(sortParams, columns) ? sortParams : undefined;

    const tableRef = React.useRef<HTMLDivElement>(null);
    const activeChunkOffsetsRef = React.useRef<number[]>([]);

    // this prevent situation when filters are new, but active chunks is not yet recalculated (it will be done to the next rendrer, so we bring filters change on the next render too)
    const [filters, setFilters] = React.useState(rawFilters);

    React.useEffect(() => {
        setFilters(rawFilters);
    }, [rawFilters]);

    const nextCountsQuery = omit(
        getTableChunkQueryParams({
            offset: 0,
            limit: chunkSize,
            fetchData,
            filters,
            sortParams: activeSortParams,
            columns,
            tableName,
            noBatching,
        }),
        'offset',
        'fetchData',
    );
    const [countsQuery, setCountsQuery] = React.useState(nextCountsQuery);

    // Resizing columns must not replay cached chunk responses through a new callback.
    if (!isEqual(countsQuery, nextCountsQuery)) {
        setCountsQuery(nextCountsQuery);
    }

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

    const getActiveChunkLookupStates = () => {
        const state = store.getState();
        return activeChunkOffsetsRef.current.map((offset) => {
            const queryState = tableDataApi.endpoints.fetchTableChunk.select(
                getQueryParams(offset),
            )(state);
            return {
                offset,
                status: queryState.status,
                fulfilledTimeStamp: queryState.fulfilledTimeStamp,
            };
        });
    };

    const getRowLookupRevision = (revision?: string) =>
        getChunkLookupRevision(getActiveChunkLookupStates(), revision);

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

    const isRowLookupPending = (revision: string | undefined) =>
        isChunkLookupPending(getActiveChunkLookupStates(), revision);

    const handleActiveChunkOffsetsChange = React.useCallback((offsets: number[]) => {
        activeChunkOffsetsRef.current = offsets;
    }, []);

    const activateRow = (index: number) => {
        const row = getRow(index);
        if (row !== undefined) {
            onKeyboardActivate?.(row);
        }
    };

    const handleDataFetched = React.useCallback(
        (data: PaginatedTableData<T>) => {
            dispatchCounts({
                type: 'dataReceived',
                query: countsQuery,
                total: data.total,
                found: data.found,
            });
            onDataFetched?.(data);
        },
        [countsQuery, dispatchCounts, onDataFetched],
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

    React.useLayoutEffect(() => {
        dispatchCounts({type: 'initialize', query: countsQuery, initialEntitiesCount});
    }, [countsQuery, initialEntitiesCount, dispatchCounts]);

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
                    onActiveChunkOffsetsChange={handleActiveChunkOffsetsChange}
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
            getRowLookupRevision={getKeyboardRowKey ? getRowLookupRevision : undefined}
            isRowLookupPending={getKeyboardRowKey ? isRowLookupPending : undefined}
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
