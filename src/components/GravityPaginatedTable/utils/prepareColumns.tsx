import type {ColumnDef} from '@gravity-ui/table/tanstack';

import {LoadingCell} from '../components/LoadingCell';
import {b} from '../shared';
import type {Column} from '../types';

interface PrepareColumnsParams<T> {
    columns: Column<T>[];
    rowHeight: number;
    tableColumnsWidth: Record<string, number>;
}

export function prepareColumns<T>({
    columns,
    rowHeight,
    tableColumnsWidth,
}: PrepareColumnsParams<T>): ColumnDef<T | undefined>[] {
    return columns.map((column) => ({
        id: column.name,
        header: () => (
            <span className={b('head-cell-content')}>{column.header ?? column.name}</span>
        ),
        accessorFn: (row) => row?.[column.name as keyof typeof row],
        cell: ({row}) => {
            if (!row.original) {
                return <LoadingCell height={rowHeight} />;
            }
            return column.render({
                row: row.original,
                index: row.index,
            });
        },
        size: tableColumnsWidth[column.name] ?? column.width,
    }));
}
