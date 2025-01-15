import React from 'react';

import {Table, useRowVirtualizer, useTable} from '@gravity-ui/table';
import type {ColumnDef} from '@gravity-ui/table/tanstack';
import {ErrorBoundary} from 'react-error-boundary';

import {useAutoRefreshInterval} from '../../utils/hooks';
import {useTableResize} from '../../utils/hooks/useTableResize';
import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';

import {b} from './shared';
import type {GravityPaginatedTableProps} from './types';
import {useTableData} from './useTableData';

import './GravityPaginatedTable.scss';

const ROW_HEIGHT = 51;
const DEFAULT_MAX_VISIBLE_ROWS = 10;
const OVERSCAN_COUNT = 5;

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
    maxVisibleRows = DEFAULT_MAX_VISIBLE_ROWS,
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
        autoRefreshInterval,
        getRowId,
    });

    // Create virtual rows array with loading placeholders
    const virtualRows = React.useMemo(() => {
        const rows: Array<{id: string; isLoading?: boolean; data?: T}> = [];

        // Add loaded data
        data.forEach((item, index) => {
            rows[index] = {
                id: String(getRowId(item)),
                data: item,
            };
        });

        // Add loading placeholders for unloaded data
        if (hasNextPage) {
            for (let i = data.length; i < totalEntities; i++) {
                rows[i] = {
                    id: `loading-${i}`,
                    isLoading: true,
                };
            }
        }

        return rows;
    }, [data, totalEntities, hasNextPage, getRowId]);

    // Table columns configuration
    const tableColumns = React.useMemo<ColumnDef<(typeof virtualRows)[0]>[]>(
        () =>
            columns.map((column) => ({
                id: column.name,
                header: () => column.header ?? column.name,
                accessorKey: column.name,
                cell: ({row}) => {
                    if (row.original.isLoading) {
                        return <div className={b('loading-cell')} />;
                    }
                    if (!row.original.data) {
                        return null;
                    }
                    return column.render({
                        row: row.original.data,
                        index: row.index,
                    });
                },
                size: tableColumnsWidth[column.name] ?? column.width,
                enableSorting: column.sortable,
                enableResizing: column.resizeable,
            })),
        [columns, tableColumnsWidth, rowHeight],
    );

    // Table configuration
    const table = useTable({
        columns: tableColumns,
        data: virtualRows,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        manualPagination: true,
        getRowId: (row) => row.id,
        onColumnSizingChange: (updater) => {
            if (typeof updater === 'function') {
                const newSizing = updater({});
                Object.entries(newSizing).forEach(([columnId, width]) => {
                    handleColumnResize(columnId, width);
                });
            }
        },
    });

    // Virtualization setup
    const rowVirtualizer = useRowVirtualizer({
        count: totalEntities,
        estimateSize: () => rowHeight,
        overscan: OVERSCAN_COUNT,
        getScrollElement: () => containerRef.current,
    });

    // Load more data when scrolling near the end
    React.useEffect(() => {
        const range = rowVirtualizer.range;
        const endIndex = range?.endIndex;
        if (endIndex !== undefined && endIndex > data.length - 5 && hasNextPage && !isLoadingMore) {
            loadMoreData();
        }
    }, [rowVirtualizer.range, data.length, hasNextPage, isLoadingMore, loadMoreData]);

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
                    height: Math.min(totalEntities * rowHeight, maxVisibleRows * rowHeight),
                    overflow: 'auto',
                }}
            >
                <Table
                    table={table}
                    rowVirtualizer={rowVirtualizer}
                    className={b('table', {
                        loading: isLoading || isLoadingMore,
                    })}
                    rowClassName={(row) => {
                        if (row?.original.isLoading) {
                            return b('row', {loading: true});
                        }
                        if (row?.original.data && getRowClassName) {
                            return getRowClassName(row.original.data) || '';
                        }
                        return '';
                    }}
                    stickyHeader
                    size="m"
                    emptyContent={
                        isLoading ? (
                            <div className={b('loading')} role="status" aria-busy="true">
                                Loading data...
                            </div>
                        ) : error && renderErrorMessage ? (
                            <div className={b('error-message')} role="alert">
                                {renderErrorMessage(error)}
                            </div>
                        ) : !data.length && renderEmptyDataMessage ? (
                            <div className={b('empty-message')}>{renderEmptyDataMessage()}</div>
                        ) : null
                    }
                />
                {isLoadingMore && (
                    <div className={b('loading-more')} role="status">
                        Loading more data...
                    </div>
                )}
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
