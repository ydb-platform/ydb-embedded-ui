import React from 'react';

import type {Column, DataTableProps, SortOrder} from '@gravity-ui/react-data-table';
import DataTable, {updateColumnsWidth} from '@gravity-ui/react-data-table';
import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {useTableResize} from '../../utils/hooks/useTableResize';
import {TableSkeleton} from '../TableSkeleton/TableSkeleton';

import './ResizeableDataTable.scss';

const b = cn('ydb-resizeable-data-table');

export interface ResizeableDataTableProps<T> extends Omit<DataTableProps<T>, 'theme' | 'onResize'> {
    columnsWidthLSKey?: string;
    wrapperClassName?: string;

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
    columnsWidthLSKey,
    columns,
    settings,
    wrapperClassName,
    isLoading,
    isFetching,
    loadingSkeletonRowsCount = 2,
    onSort,
    onSortChange,
    data,
    ...props
}: ResizeableDataTableProps<T>) {
    const [tableColumnsWidth, setTableColumnsWidth] = useTableResize(columnsWidthLSKey);

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

    const updatedColumns = updateColumnsWidth(processedColumns, tableColumnsWidth);

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
            defaultResizeable: true,
        };
    }, [settings]);

    if (isLoading) {
        return <TableSkeleton rows={loadingSkeletonRowsCount} />;
    }

    return (
        <div className={b(null, wrapperClassName)}>
            <DataTable
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
