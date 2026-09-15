import React from 'react';

import type {Column, DataTableProps, Settings, SortOrder} from '@gravity-ui/react-data-table';
import DataTable, {updateColumnsWidth} from '@gravity-ui/react-data-table';
import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {useTableResize} from '../../utils/hooks/useTableResize';
import {useTableNavigationEnabled} from '../TableKeyboardNavigation/TableKeyboardNavigation';
import {KEYBOARD_FOCUS_ACTIVE_CLASS_NAME} from '../TableKeyboardNavigation/utils';
import {TableSkeleton} from '../TableSkeleton/TableSkeleton';

import {DataTableKeyboardNavigation} from './DataTableKeyboardNavigation';

import './ResizeableDataTable.scss';

const b = cn('ydb-resizeable-data-table');

export interface ResizeableDataTableProps<T> extends Omit<DataTableProps<T>, 'theme' | 'onResize'> {
    columnsWidthLSKey?: string;
    reserveResizePadding?: boolean;
    wrapperClassName?: string;
    onKeyboardActivate?: (row: T) => void;
    getKeyboardRowKey?: (row: T) => string | number | undefined;

    /**
     * Not enough meta data (settings, sizes, features, etc.) to properly render table columns
     * Use case: initial load
     */
    isLoading?: boolean;
    /**
     * No table data, but columns data is loaded and they could be rendered
     * Use case: you need to preserve table headers on sort change when backend sort
     */
    isFetching?: boolean;
    loadingSkeletonRowsCount?: number;

    onSortChange?: (params: SortOrder | SortOrder[] | undefined) => void;
}

export function ResizeableDataTable<T>({
    onKeyboardActivate,
    getKeyboardRowKey,
    rowClassName,
    wrapperClassName,
    onSortChange,
    ...props
}: ResizeableDataTableProps<T>) {
    const enabled = useTableNavigationEnabled();
    if (!enabled) {
        return (
            <ResizeableDataTableContent
                {...props}
                rowClassName={rowClassName}
                wrapperClassName={wrapperClassName}
                onSortChange={onSortChange}
            />
        );
    }
    return (
        <DataTableKeyboardNavigation
            data={props.data}
            columns={props.columns}
            settings={props.settings}
            nullBeforeNumbers={props.nullBeforeNumbers}
            onActivate={onKeyboardActivate}
            getRowKey={getKeyboardRowKey}
            sortOrder={props.sortOrder}
        >
            {({
                getRowClassName,
                active,
                onSort,
                tableRef,
                onTableReady,
                onMouseMove,
                dynamicInnerRef,
            }) => (
                <ResizeableDataTableContent
                    {...props}
                    containerRef={tableRef}
                    onTableReady={onTableReady}
                    onMouseMove={onMouseMove}
                    dynamicInnerRef={dynamicInnerRef}
                    rowClassName={(row, index, isFooter, isHeader) =>
                        [
                            rowClassName?.(row, index, isFooter, isHeader),
                            !isFooter && !isHeader ? getRowClassName(index) : undefined,
                        ]
                            .filter(Boolean)
                            .join(' ')
                    }
                    wrapperClassName={[
                        wrapperClassName,
                        active ? KEYBOARD_FOCUS_ACTIVE_CLASS_NAME : undefined,
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    onSortChange={(order) => {
                        onSort(order);
                        onSortChange?.(order);
                    }}
                />
            )}
        </DataTableKeyboardNavigation>
    );
}

function ResizeableDataTableContent<T>({
    containerRef,
    onTableReady,
    onMouseMove,
    dynamicInnerRef,
    columnsWidthLSKey,
    columns,
    settings,
    reserveResizePadding = true,
    wrapperClassName,
    isLoading,
    isFetching,
    loadingSkeletonRowsCount = 2,
    onSort,
    onSortChange,
    data,
    ...props
}: ResizeableDataTableProps<T> & {
    containerRef?: React.Ref<HTMLDivElement>;
    onTableReady?: React.Ref<DataTable<T>>;
    onMouseMove?: React.MouseEventHandler<HTMLElement>;
    dynamicInnerRef?: Settings['dynamicInnerRef'];
}) {
    const [tableColumnsWidth, setTableColumnsWidth, isTableWidthLoading] =
        useTableResize(columnsWidthLSKey);

    const handleSort = React.useCallback(
        (params: SortOrder | SortOrder[] | undefined) => {
            onSort?.(params); // Original onSort if provided
            onSortChange?.(params); // Expose sort params to parent
        },
        [onSort, onSortChange],
    );

    // If loading is true, override the render method of each column to display a Skeleton
    const processedColumns = React.useMemo(() => {
        if (isFetching) {
            return columns.map((column: Column<T>) => ({
                ...column,
                render: () => <Skeleton className={b('row-skeleton')} />,
            }));
        }
        return columns;
    }, [isFetching, columns]);

    const updatedColumns = React.useMemo(
        () => updateColumnsWidth(processedColumns, tableColumnsWidth),
        [processedColumns, tableColumnsWidth],
    );

    const processedData = React.useMemo(() => {
        if (isFetching && !data?.length) {
            // We do not use data in render method when loading, so we can return an array of empty objects
            return Array.from({length: loadingSkeletonRowsCount}, () => ({}) as T);
        }
        return data;
    }, [isFetching, data, loadingSkeletonRowsCount]);

    const newSettings = React.useMemo(() => {
        return {
            ...settings,
            ...(dynamicInnerRef ? {dynamicInnerRef} : {}),
            defaultResizeable: true,
        };
    }, [settings, dynamicInnerRef]);

    if (isLoading || isTableWidthLoading) {
        return <TableSkeleton rows={loadingSkeletonRowsCount} />;
    }

    return (
        <div
            ref={containerRef}
            onMouseMoveCapture={onMouseMove}
            className={b({'reserve-resize-padding': reserveResizePadding}, wrapperClassName)}
        >
            <DataTable
                ref={onTableReady}
                theme="yandex-cloud"
                columns={updatedColumns}
                onResize={setTableColumnsWidth}
                onSort={handleSort}
                settings={newSettings}
                data={processedData}
                {...props}
            />
        </div>
    );
}
