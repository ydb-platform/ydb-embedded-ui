import type {ColumnWidthByName} from '@gravity-ui/react-data-table';

import {useTableResize} from '../../utils/hooks/useTableResize';

import type {PaginatedTableProps} from './PaginatedTable';
import {PaginatedTable} from './PaginatedTable';
import {b} from './shared';
import type {Column, PaginatedTableState} from './types';

function updateColumnsWidth<T>(columns: Column<T>[], columnsWidthSetup: ColumnWidthByName) {
    return columns.map((column) => {
        return {...column, width: columnsWidthSetup[column.name] ?? column.width};
    });
}

interface ResizeablePaginatedTableProps<T, F>
    extends Omit<PaginatedTableProps<T, F>, 'onColumnsResize'> {
    columnsWidthLSKey: string;
    onStateChange?: (state: PaginatedTableState) => void;
}

export function ResizeablePaginatedTable<T, F>({
    columnsWidthLSKey,
    columns,
    tableContainerRef,
    ...props
}: ResizeablePaginatedTableProps<T, F>) {
    const [tableColumnsWidth, setTableColumnsWidth] = useTableResize(columnsWidthLSKey);

    const updatedColumns = updateColumnsWidth(columns, tableColumnsWidth);

    return (
        <PaginatedTable
            tableContainerRef={tableContainerRef}
            columns={updatedColumns}
            onColumnsResize={setTableColumnsWidth}
            containerClassName={b('resizeable-table-container')}
            {...props}
        />
    );
}
