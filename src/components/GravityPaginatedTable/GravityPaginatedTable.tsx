import React from 'react';

import {Table, useTable} from '@gravity-ui/table';
import type {SortingState} from '@gravity-ui/table/tanstack';
import {ErrorBoundary} from 'react-error-boundary';

import {useAutoRefreshInterval} from '../../utils/hooks';
import {useTableResize} from '../../utils/hooks/useTableResize';
import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';

import {EmptyContent} from './components/EmptyContent';
import {SortIcon} from './components/SortIcon';
import {DEFAULT_TABLE_ROW_HEIGHT} from './constants';
import {useTableData} from './hooks/useTableData';
import {b} from './shared';
import type {GravityPaginatedTableProps} from './types';
import {prepareColumns} from './utils/prepareColumns';

import './GravityPaginatedTable.scss';

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
    rowHeight = DEFAULT_TABLE_ROW_HEIGHT,
}: GravityPaginatedTableProps<T, F>) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [tableColumnsWidth, handleColumnResize] = useTableResize(columnsWidthLSKey);
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const containerRef = React.useRef<HTMLDivElement>(null);

    // Table data management with virtualizer
    const {data, isLoading, error, totalEntities, foundEntities, rowVirtualizer} = useTableData({
        fetchData,
        filters,
        tableName,
        columns,
        autoRefreshInterval,
        rowHeight,
        containerRef,
        initialEntitiesCount,
        sorting,
    });

    // Table columns configuration
    const tableColumns = React.useMemo(
        () =>
            prepareColumns({
                columns,
                rowHeight,
                tableColumnsWidth,
            }),
        [columns, rowHeight, tableColumnsWidth],
    );

    // Table configuration
    const table = useTable({
        columns: tableColumns,
        data,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        manualPagination: true,
        enableSorting: true,
        manualSorting: true,
        onSortingChange: setSorting,
        state: {
            sorting,
        },
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
            <div ref={containerRef} className={b('virtualized-content')}>
                <Table
                    table={table}
                    rowVirtualizer={rowVirtualizer}
                    className={b('table')}
                    headerClassName={b('head')}
                    sortIndicatorClassName={b('sort-indicator')}
                    headerCellClassName={b('head-cell-wrapper')}
                    renderSortIndicator={({header}) => (
                        <SortIcon
                            isSorted={header.column.getIsSorted() !== false}
                            sortDirection={header.column.getIsSorted() || undefined}
                        />
                    )}
                    rowClassName={(row) => {
                        if (getRowClassName && row?.original) {
                            return getRowClassName(row.original) || '';
                        }
                        return '';
                    }}
                    stickyHeader
                    size="s"
                    emptyContent={() => (
                        <EmptyContent
                            error={error}
                            foundEntities={foundEntities}
                            renderErrorMessage={renderErrorMessage}
                            renderEmptyDataMessage={renderEmptyDataMessage}
                        />
                    )}
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
