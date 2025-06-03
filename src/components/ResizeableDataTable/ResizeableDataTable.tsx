import React from 'react';

import type {Column, DataTableProps, Settings, SortOrder} from '@gravity-ui/react-data-table';
import DataTable, {updateColumnsWidth} from '@gravity-ui/react-data-table';
import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {useTableResize} from '../../utils/hooks/useTableResize';

import './ResizeableDataTable.scss';

const b = cn('ydb-resizeable-data-table');

export interface ResizeableDataTableProps<T> extends Omit<DataTableProps<T>, 'theme' | 'onResize'> {
    columnsWidthLSKey?: string;
    wrapperClassName?: string;
    loading?: boolean;
    onSortChange?: (params: SortOrder | SortOrder[] | undefined) => void;
}

export function ResizeableDataTable<T>({
    columnsWidthLSKey,
    columns,
    settings,
    wrapperClassName,
    loading,
    onSort,
    onSortChange,
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
    const processedColumns = loading
        ? columns.map((column: Column<T>) => ({
              ...column,
              render: () => <Skeleton className={b('row-skeleton')} />,
          }))
        : columns;

    const updatedColumns = updateColumnsWidth(processedColumns, tableColumnsWidth);

    const newSettings: Settings = {
        ...settings,
        defaultResizeable: true,
    };

    return (
        <div className={b(null, wrapperClassName)}>
            <DataTable
                theme="yandex-cloud"
                columns={updatedColumns}
                onResize={setTableColumnsWidth}
                onSort={handleSort}
                settings={newSettings}
                {...props}
            />
        </div>
    );
}
