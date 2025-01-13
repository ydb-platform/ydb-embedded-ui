import React from 'react';

import {Table, useRowVirtualizer, useTable} from '@gravity-ui/table';
import type {ColumnDef} from '@gravity-ui/table/tanstack';
import {ErrorBoundary} from 'react-error-boundary';

import {cn} from '../../utils/cn';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {useTableResize} from '../../utils/hooks/useTableResize';

import type {BaseEntity, GravityPaginatedTableProps} from './GravityPaginatedTable.types';
import {TableContainer} from './TableContainer';
import {useInfiniteScroll} from './useInfiniteScroll';
import {useTableData} from './useTableData';

import './GravityPaginatedTable.scss';

const b = cn('ydb-gravity-paginated-table');

const ROW_HEIGHT = 51;
const OVERSCAN_COUNT = 5;

/**
 * GravityPaginatedTable is an enhanced table component that supports:
 * - Column resizing with persistence
 * - Infinite scroll pagination
 * - Row virtualization for performance
 * - Auto-refresh capability
 * - Custom row styling
 * - Error handling
 * - Loading states
 */
export function GravityPaginatedTable<T extends BaseEntity, F>({
    columnsWidthLSKey,
    columns,
    fetchData,
    filters,
    tableName = 'default',
    getRowClassName,
    parentRef,
    renderControls,
    renderErrorMessage,
    renderEmptyDataMessage,
    rowHeight = ROW_HEIGHT,
    initialEntitiesCount = 0,
}: GravityPaginatedTableProps<T, F>) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [tableColumnsWidth, handleColumnResize] = useTableResize(columnsWidthLSKey);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Table data management
    const {
        data,
        isLoading,
        isLoadingMore,
        hasNextPage,
        error,
        totalEntities,
        foundEntities,
        loadMoreData,
    } = useTableData({
        fetchData,
        filters,
        tableName,
        columns,
        initialEntitiesCount,
        autoRefreshInterval,
    });

    // Infinite scroll handling
    useInfiniteScroll({
        containerRef,
        onLoadMore: loadMoreData,
        hasNextPage,
        isLoading: isLoadingMore,
        threshold: rowHeight * OVERSCAN_COUNT,
    });

    // Table columns configuration
    const tableColumns = React.useMemo<ColumnDef<T>[]>(
        () =>
            columns.map((column) => ({
                id: column.name,
                header: () => column.header ?? column.name,
                accessorKey: column.name,
                cell: ({row}) => column.render({row: row.original, index: row.index}),
                size: tableColumnsWidth[column.name] ?? column.width,
                enableSorting: column.sortable,
                enableResizing: column.resizeable,
            })),
        [columns, tableColumnsWidth],
    );

    // Table configuration
    const table = useTable({
        columns: tableColumns,
        data,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        manualPagination: true,
        getRowId: (row) => String(row.id),
        onColumnSizingChange: (updater) => {
            if (typeof updater === 'function') {
                const newSizing = updater({});
                Object.entries(newSizing).forEach(([columnId, width]) => {
                    handleColumnResize(columnId, width);
                });
            }
        },
    });

    // Initialize virtualizer
    const rowVirtualizer = useRowVirtualizer({
        count: data.length || initialEntitiesCount,
        estimateSize: () => rowHeight,
        overscan: OVERSCAN_COUNT,
        getScrollElement: () => containerRef.current,
    });

    // Row class name handler
    const getRowClassNameWrapper = React.useCallback(
        (row?: {original: T}) => {
            if (!row?.original || !getRowClassName) {
                return '';
            }
            return getRowClassName(row.original) || '';
        },
        [getRowClassName],
    );

    // Loading state
    if (!data.length && isLoading) {
        return (
            <div ref={parentRef} className={b('resizeable-table-container')}>
                <div className={b('loading')} role="status" aria-busy="true">
                    Loading data...
                </div>
            </div>
        );
    }

    // Error handling
    if (error && renderErrorMessage) {
        return (
            <div className={b('error-message')} role="alert">
                {renderErrorMessage(error)}
            </div>
        );
    }

    // Table content
    const tableContent = (
        <ErrorBoundary
            fallback={
                <div className={b('error-message')} role="alert">
                    An error occurred while rendering the table. Please try refreshing the page.
                </div>
            }
        >
            <TableContainer ref={containerRef}>
                <div
                    className={b('virtualized-content')}
                    style={{height: `${rowVirtualizer.getTotalSize()}px`}}
                    role="grid"
                    aria-rowcount={data.length}
                    aria-busy={isLoading || isLoadingMore}
                >
                    <Table
                        table={table}
                        className={b('table', {loading: isLoading || isLoadingMore})}
                        rowClassName={getRowClassNameWrapper}
                        emptyContent={isLoading ? null : renderEmptyDataMessage?.()}
                        rowVirtualizer={rowVirtualizer}
                    />
                    {isLoadingMore && (
                        <div className={b('loading-more')} role="status">
                            Loading more data...
                        </div>
                    )}
                </div>
            </TableContainer>
        </ErrorBoundary>
    );

    // Render with optional controls
    return (
        <div
            ref={parentRef}
            className={b('resizeable-table-container')}
            role="region"
            aria-label="Paginated data table"
        >
            {renderControls && (
                <div className={b('controls')}>
                    {renderControls({
                        inited: !isLoading,
                        totalEntities,
                        foundEntities,
                    })}
                </div>
            )}
            {tableContent}
        </div>
    );
}

GravityPaginatedTable.displayName = 'GravityPaginatedTable';
