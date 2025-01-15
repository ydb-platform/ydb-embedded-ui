import React from 'react';

import {Table, useTable} from '@gravity-ui/table';
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
    initialEntitiesCount,
    rowHeight = ROW_HEIGHT,
}: GravityPaginatedTableProps<T, F>) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [tableColumnsWidth, handleColumnResize] = useTableResize(columnsWidthLSKey);

    const containerRef = React.useRef<HTMLDivElement>(null);

    // Table data management with virtualizer
    const {data, isLoading, error, totalEntities, foundEntities, rowVirtualizer, rows} =
        useTableData({
            fetchData,
            filters,
            tableName,
            columns,
            autoRefreshInterval,
            rowHeight,
            containerRef,
            overscanCount: OVERSCAN_COUNT,
            initialEntitiesCount,
        });

    // Table columns configuration
    const tableColumns = React.useMemo<ColumnDef<T | undefined>[]>(
        () =>
            columns.map((column) => ({
                id: column.name,
                header: () => column.header ?? column.name,
                cell: ({row}) => {
                    if (!row.original) {
                        return <div className={b('loading-cell')} />;
                    }
                    return column.render({
                        row: row.original,
                        index: row.index,
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
        data: rows,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        manualPagination: true,
        getRowId: (_, index) => `row-${index}`,
        onColumnSizingChange: (updater) => {
            if (typeof updater === 'function') {
                const newSizing = updater({});
                Object.entries(newSizing).forEach(([columnId, width]) => {
                    handleColumnResize(columnId, width);
                });
            }
        },
    });

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
                    overflow: 'auto',
                    height: '90vh',
                }}
            >
                <Table
                    table={table}
                    rowVirtualizer={rowVirtualizer}
                    className={b('table')}
                    rowClassName={(row) => {
                        if (!row?.original) {
                            return b('row', {loading: true});
                        }
                        if (getRowClassName) {
                            return getRowClassName(row.original) || '';
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
