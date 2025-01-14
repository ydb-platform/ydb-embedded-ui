import React from 'react';

import {useTable} from '@gravity-ui/table';
import type {ColumnDef} from '@gravity-ui/table/tanstack';
import {ErrorBoundary} from 'react-error-boundary';

import {useAutoRefreshInterval} from '../../utils/hooks';
import {useTableResize} from '../../utils/hooks/useTableResize';
import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';

import {TableHead} from './components/TableHead';
import {VirtualRows} from './components/VirtualRows';
import {useVirtualization} from './features/virtualization';
import {b} from './shared';
import type {GravityPaginatedTableProps} from './types';
import {useTableData} from './useTableData';

import './GravityPaginatedTable.scss';

const ROW_HEIGHT = 51;
const DEFAULT_MAX_VISIBLE_ROWS = 10;

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

export function GravityPaginatedTable<T, F>({
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
    getRowId,
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
        getRowId,
    });

    // Virtualization setup
    const {virtualRows, virtualItems, totalSize} = useVirtualization({
        data,
        totalEntities,
        rowHeight,
        containerRef,
        isLoadingMore,
        getRowId,
    });

    // Table columns configuration
    const tableColumns = React.useMemo<ColumnDef<(typeof virtualRows)[0]>[]>(
        () =>
            columns.map((column) => ({
                id: column.name,
                header: () => column.header ?? column.name,
                accessorKey: column.name,
                cell: ({row}) => {
                    const originalData = row.original.data;
                    if (!originalData) {
                        return null;
                    }
                    return column.render({
                        row: originalData,
                        index: row.original.index,
                    });
                },
                size: tableColumnsWidth[column.name] ?? column.width,
                enableSorting: column.sortable,
                enableResizing: column.resizeable,
            })),
        [columns, tableColumnsWidth],
    );

    // Table configuration
    const table = useTable({
        columns: tableColumns,
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

    // Load more data before virtualizer needs it
    React.useEffect(() => {
        const lastItem = virtualItems[virtualItems.length - 1];
        if (lastItem && lastItem.index > data.length - 5 && hasNextPage && !isLoadingMore) {
            loadMoreData();
        }
    }, [virtualItems, data.length, hasNextPage, isLoadingMore, loadMoreData]);

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

    // Empty state
    if (!isLoading && !data.length && renderEmptyDataMessage) {
        return (
            <div ref={parentRef} className={b('resizeable-table-container')}>
                <div className={b('empty-message')}>{renderEmptyDataMessage()}</div>
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
            <div
                ref={containerRef}
                className={b('virtualized-content')}
                style={{
                    height: calculateInitialHeight({
                        initialEntitiesCount,
                        rowHeight,
                        maxVisibleRows,
                        minHeight,
                    }),
                    overflow: 'auto',
                }}
            >
                <div style={{height: `${totalSize}px`}}>
                    <table className={b('table', {loading: isLoading || isLoadingMore})}>
                        <TableHead table={table} rowHeight={rowHeight} />
                        <tbody>
                            <VirtualRows
                                virtualItems={virtualItems}
                                virtualRows={virtualRows}
                                columns={tableColumns}
                                rowHeight={rowHeight}
                                getRowClassName={getRowClassName}
                                table={table}
                            />
                        </tbody>
                    </table>
                    {isLoadingMore && (
                        <div className={b('loading-more')} role="status">
                            Loading more data...
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );

    // Render with optional controls
    const renderContent = () => {
        if (renderControls) {
            return (
                <TableWithControlsLayout>
                    <TableWithControlsLayout.Controls>
                        {renderControls({
                            inited: !isLoading,
                            totalEntities,
                            foundEntities,
                        })}
                    </TableWithControlsLayout.Controls>
                    <TableWithControlsLayout.Table>{tableContent}</TableWithControlsLayout.Table>
                </TableWithControlsLayout>
            );
        }

        return tableContent;
    };

    return (
        <div
            ref={parentRef}
            className={b('resizeable-table-container')}
            role="region"
            aria-label="Paginated data table"
        >
            {renderContent()}
        </div>
    );
}

GravityPaginatedTable.displayName = 'GravityPaginatedTable';
