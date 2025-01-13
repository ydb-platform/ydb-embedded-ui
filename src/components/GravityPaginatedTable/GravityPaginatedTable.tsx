import React from 'react';

import {Table, useRowVirtualizer, useTable} from '@gravity-ui/table';
import type {ColumnDef} from '@gravity-ui/table/tanstack';
import {Skeleton} from '@gravity-ui/uikit';
import {ErrorBoundary} from 'react-error-boundary';

import {cn} from '../../utils/cn';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {useTableResize} from '../../utils/hooks/useTableResize';
import {DEFAULT_ALIGN, DEFAULT_RESIZEABLE} from '../PaginatedTable/constants';
import {b as tableB} from '../PaginatedTable/shared';
import type {AlignType} from '../PaginatedTable/types';

import type {
    BaseEntity,
    GravityPaginatedTableProps,
    VirtualRow,
} from './GravityPaginatedTable.types';
import {TableContainer} from './TableContainer';
import {useTableData} from './useTableData';

import './GravityPaginatedTable.scss';

const b = cn('ydb-gravity-paginated-table');

const ROW_HEIGHT = 51;
const OVERSCAN_COUNT = 5;
const DEFAULT_MAX_VISIBLE_ROWS = 10;

interface TableCellProps {
    height: number;
    width?: number;
    align?: AlignType;
    children: React.ReactNode;
    className?: string;
    resizeable?: boolean;
}

const TableRowCell = ({
    children,
    className,
    height,
    width,
    align = DEFAULT_ALIGN,
    resizeable,
}: TableCellProps) => {
    return (
        <td
            className={tableB('row-cell', {align: align}, className)}
            style={{
                height: `${height}px`,
                width: `${width}px`,
                maxWidth: resizeable ? `${width}px` : undefined,
            }}
        >
            {children}
        </td>
    );
};

const calculateInitialHeight = (params: {
    initialEntitiesCount?: number;
    rowHeight: number;
    maxVisibleRows: number;
    minHeight?: number;
}) => {
    const {initialEntitiesCount, rowHeight, maxVisibleRows, minHeight} = params;
    const calculatedHeight = Math.min(
        (initialEntitiesCount || 1) * rowHeight,
        maxVisibleRows * rowHeight,
    );
    return Math.max(calculatedHeight, minHeight || rowHeight * 3);
};

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
    maxVisibleRows = DEFAULT_MAX_VISIBLE_ROWS,
    minHeight,
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

    // Generate virtual rows for the table
    const virtualRows = React.useMemo(() => {
        const items: VirtualRow<T>[] = data.map((item, index) => ({
            id: item.id || item.NodeId || index,
            type: 'data',
            data: item,
            index,
        }));

        // Add loading/empty rows for unloaded content
        for (let i = data.length; i < totalEntities; i++) {
            items[i] = {
                id: `virtual-${i}`,
                type: isLoadingMore && i < data.length + OVERSCAN_COUNT ? 'loading' : 'empty',
                index: i,
            };
        }
        return items;
    }, [data, totalEntities, isLoadingMore]);

    // Table columns with virtual row handling
    const virtualTableColumns = React.useMemo<ColumnDef<VirtualRow<T>>[]>(
        () =>
            columns.map((column) => ({
                id: column.name,
                header: () => column.header ?? column.name,
                accessorKey: column.name,
                cell: ({row}) => {
                    const virtualRow = row.original;
                    const resizeable = column.resizeable ?? DEFAULT_RESIZEABLE;

                    return (
                        <TableRowCell
                            height={rowHeight}
                            width={column.width}
                            align={column.align}
                            className={column.className}
                            resizeable={resizeable}
                        >
                            {virtualRow.type === 'data' && virtualRow.data ? (
                                column.render({
                                    row: virtualRow.data,
                                    index: virtualRow.index,
                                })
                            ) : virtualRow.type === 'loading' ? (
                                <Skeleton
                                    className={tableB('row-skeleton')}
                                    style={{width: '80%', height: '50%'}}
                                />
                            ) : null}
                        </TableRowCell>
                    );
                },
                size: tableColumnsWidth[column.name] ?? column.width,
                enableSorting: column.sortable,
                enableResizing: column.resizeable,
            })),
        [columns, tableColumnsWidth, rowHeight],
    );

    // Table configuration
    const table = useTable({
        columns: virtualTableColumns,
        data: virtualRows,
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

    // Initialize virtualizer with full count
    const rowVirtualizer = useRowVirtualizer({
        count: totalEntities,
        estimateSize: () => rowHeight,
        overscan: OVERSCAN_COUNT,
        getScrollElement: () => containerRef.current,
    });

    // Load more data before virtualizer needs it
    React.useEffect(() => {
        const virtualItems = rowVirtualizer.getVirtualItems();
        const lastItem = virtualItems[virtualItems.length - 1];

        if (
            lastItem &&
            lastItem.index > data.length - OVERSCAN_COUNT &&
            hasNextPage &&
            !isLoadingMore
        ) {
            loadMoreData();
        }
    }, [rowVirtualizer.getVirtualItems(), data.length, hasNextPage, isLoadingMore, loadMoreData]);

    // Row class name handler
    const getRowClassNameWrapper = React.useCallback(
        (row?: {original: VirtualRow<T>}) => {
            if (!row?.original) {
                return '';
            }

            const classNames = [];
            if (row.original.type === 'loading') {
                classNames.push(tableB('row', {loading: true}));
            }
            if (row.original.type === 'empty') {
                classNames.push(tableB('row', {empty: true}));
            }

            if (row.original.type === 'data' && row.original.data && getRowClassName) {
                const customClassName = getRowClassName(row.original.data);
                if (customClassName) {
                    classNames.push(customClassName);
                }
            }

            return classNames.join(' ');
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
            <TableContainer
                ref={containerRef}
                initialHeight={calculateInitialHeight({
                    initialEntitiesCount,
                    rowHeight,
                    maxVisibleRows,
                    minHeight,
                })}
            >
                <div
                    className={b('virtualized-content')}
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                    }}
                    role="grid"
                    aria-rowcount={totalEntities}
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
