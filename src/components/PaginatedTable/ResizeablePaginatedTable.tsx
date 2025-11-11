import type {ColumnWidthByName} from '@gravity-ui/react-data-table';

import {useTableResize} from '../../utils/hooks/useTableResize';
import {TableSkeleton} from '../TableSkeleton/TableSkeleton';

import type {PaginatedTableProps} from './PaginatedTable';
import {PaginatedTable} from './PaginatedTable';
import {b} from './shared';
import type {Column} from './types';

function updateColumnsWidth<T>(columns: Column<T>[], columnsWidthSetup: ColumnWidthByName) {
    return columns.map((column) => {
        return {...column, width: columnsWidthSetup[column.name] ?? column.width};
    });
}

interface ResizeablePaginatedTableProps<T, F>
    extends Omit<PaginatedTableProps<T, F>, 'onColumnsResize'> {
    columnsWidthLSKey: string;
}

export function ResizeablePaginatedTable<T, F>({
    columnsWidthLSKey,
    columns,
    ...props
}: ResizeablePaginatedTableProps<T, F>) {
    const [tableColumnsWidth, setTableColumnsWidth, isTableWidthLoading] =
        useTableResize(columnsWidthLSKey);

    const updatedColumns = updateColumnsWidth(columns, tableColumnsWidth);

    if (isTableWidthLoading) {
        return <TableSkeleton />;
    }

    return (
        <PaginatedTable
            columns={updatedColumns}
            onColumnsResize={setTableColumnsWidth}
            containerClassName={b('resizeable-table-container')}
            {...props}
        />
    );
}
