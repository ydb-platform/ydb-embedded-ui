import React from 'react';

import {Table, useRowVirtualizer, useTable} from '@gravity-ui/table';
import type {ColumnDef} from '@gravity-ui/table/tanstack';

import {tableDataApi} from '../../store/reducers/tableData';
import type {IResponseError} from '../../types/api/error';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {useTableResize} from '../../utils/hooks/useTableResize';

import type {Column, FetchData} from './types';

import './ResizeablePaginatedTableV2.scss';

const b = cn('ydb-resizeable-paginated-table-v2');

const CHUNK_SIZE = 50;
const ROW_HEIGHT = 51;
const OVERSCAN_COUNT = 5;

interface ResizeablePaginatedTableV2Props<T, F> {
    columnsWidthLSKey: string;
    columns: Column<T>[];
    fetchData: FetchData<T, F>;
    filters?: F;
    tableName?: string;
    getRowClassName?: (row: T) => string | undefined;
    rowHeight?: number;
    parentRef: React.RefObject<HTMLDivElement>;
    renderControls?: (props: {
        inited: boolean;
        totalEntities: number;
        foundEntities: number;
    }) => React.ReactNode;
    renderErrorMessage?: (error: IResponseError) => React.ReactNode;
    renderEmptyDataMessage?: () => React.ReactNode;
    initialEntitiesCount?: number;
}

interface QueryParams {
    offset: number;
    limit: number;
    fetchData: FetchData<unknown, unknown>;
    filters: unknown;
    columnsIds: string[];
    tableName: string;
}

export function ResizeablePaginatedTableV2<T, F>({
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
}: ResizeablePaginatedTableV2Props<T, F>) {
    // Basic state
    const [tableColumnsWidth, handleColumnResize] = useTableResize(columnsWidthLSKey);
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [data, setData] = React.useState<T[]>([]);

    // Base query parameters
    const baseQueryParams: QueryParams = React.useMemo(
        () => ({
            offset: 0,
            limit: CHUNK_SIZE,
            fetchData: fetchData as FetchData<unknown, unknown>,
            filters,
            columnsIds: columns.map((col) => col.name),
            tableName,
        }),
        [fetchData, filters, columns, tableName],
    );

    // Fetch initial data
    const {currentData, error, isFetching} = tableDataApi.useFetchTableChunkQuery(baseQueryParams, {
        pollingInterval: autoRefreshInterval,
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

    // Process data to ensure proper row identification
    React.useEffect(() => {
        if (currentData?.data) {
            const processedData = (currentData.data as T[]).map((item, index) => {
                const nodeId = (item as any).NodeId;
                return {
                    ...item,
                    id: String(nodeId ?? index),
                    NodeId: nodeId,
                    index,
                };
            });
            setData(processedData);
        }
    }, [currentData?.data]);

    // Table configuration
    const table = useTable({
        columns: tableColumns,
        data,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        manualPagination: true,
        manualSorting: true,
        getRowId: (row: any) => String(row.id),
        onColumnSizingChange: (updater) => {
            if (typeof updater === 'function') {
                const newSizing = updater({});
                Object.entries(newSizing).forEach(([columnId, width]) => {
                    handleColumnResize(columnId, width);
                });
            }
        },
    });

    // Initialize virtualizer with actual data
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
            const className = getRowClassName(row.original);
            return className || '';
        },
        [getRowClassName],
    );

    // Error handling
    if (error && renderErrorMessage) {
        return renderErrorMessage(error as IResponseError);
    }

    // Wait for data before rendering table
    if (!data.length && isFetching) {
        return null;
    }

    // Table content
    const tableContent = (
        <div
            ref={containerRef}
            style={{
                height: '600px',
                overflow: 'auto',
            }}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                <Table
                    table={table}
                    className={b('table', {loading: isFetching})}
                    rowClassName={getRowClassNameWrapper}
                    emptyContent={isFetching ? null : renderEmptyDataMessage?.()}
                    rowVirtualizer={rowVirtualizer}
                />
            </div>
        </div>
    );

    // Render with optional controls
    if (renderControls) {
        return (
            <div ref={parentRef} className={b('resizeable-table-container')}>
                {renderControls({
                    inited: !isFetching,
                    totalEntities: currentData?.total || initialEntitiesCount,
                    foundEntities: currentData?.found || 0,
                })}
                {tableContent}
            </div>
        );
    }

    return (
        <div ref={parentRef} className={b('resizeable-table-container')}>
            {tableContent}
        </div>
    );
}
