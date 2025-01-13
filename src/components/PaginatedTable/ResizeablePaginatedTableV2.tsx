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
    const [allData, setAllData] = React.useState<T[]>([]);
    const [hasNextPage, setHasNextPage] = React.useState(true);
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);

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

    // Create base query parameters
    const baseQueryParams = React.useMemo(
        () => ({
            fetchData: fetchData as FetchData<unknown, unknown>,
            filters,
            columnsIds: columns.map((col) => col.name),
            tableName,
        }),
        [fetchData, filters, columns, tableName],
    );

    // Initial data fetch
    const {currentData, error, isFetching} = tableDataApi.useFetchTableChunkQuery(
        {
            ...baseQueryParams,
            offset: 0,
            limit: CHUNK_SIZE,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    // Process initial data
    React.useEffect(() => {
        if (currentData?.data) {
            const processedData = (currentData.data as T[]).map((item, index) => ({
                ...item,
                id: String((item as any).NodeId ?? (item as any).id ?? index),
            }));
            setAllData(processedData);
            setHasNextPage(processedData.length < (currentData.total || 0));
        }
    }, [currentData]);

    // Load more data
    const loadMoreData = React.useCallback(async () => {
        if (!hasNextPage || isLoadingMore) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const result = await fetchData({
                ...baseQueryParams,
                offset: allData.length,
                limit: CHUNK_SIZE,
            });

            const newData = (result.data as T[]).map((item, index) => ({
                ...item,
                id: String((item as any).NodeId ?? (item as any).id ?? allData.length + index),
            }));

            setAllData((prev) => [...prev, ...newData]);
            setHasNextPage(allData.length + newData.length < (result.total || 0));
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasNextPage, isLoadingMore, allData.length, fetchData, baseQueryParams]);

    // Table configuration
    const table = useTable({
        columns: tableColumns,
        data: allData,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        manualPagination: true,
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

    // Initialize virtualizer
    const rowVirtualizer = useRowVirtualizer({
        count: allData.length || initialEntitiesCount,
        estimateSize: () => rowHeight,
        overscan: OVERSCAN_COUNT,
        getScrollElement: () => containerRef.current,
    });

    // Handle scroll to load more
    React.useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) {
                return;
            }

            const {scrollTop, scrollHeight, clientHeight} = containerRef.current;
            const scrollBottom = scrollHeight - scrollTop - clientHeight;

            if (scrollBottom < rowHeight * OVERSCAN_COUNT && !isLoadingMore && hasNextPage) {
                loadMoreData();
            }
        };

        containerRef.current?.addEventListener('scroll', handleScroll);
        return () => containerRef.current?.removeEventListener('scroll', handleScroll);
    }, [loadMoreData, rowHeight, isLoadingMore, hasNextPage]);

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

    // Wait for initial data
    if (!allData.length && isFetching) {
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
                    className={b('table', {loading: isFetching || isLoadingMore})}
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
