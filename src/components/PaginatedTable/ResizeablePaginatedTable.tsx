import type {ColumnWidthByName} from '@gravity-ui/react-data-table';

import {useTableResize} from '../../utils/hooks/useTableResize';

import type {PaginatedTableProps} from './PaginatedTable';
import {PaginatedTable} from './PaginatedTable';
import type {Column} from './types';

function updateColumnsWidth<T>(columns: Column<T>[], columnsWidthSetup: ColumnWidthByName) {
    return columns.map((column) => {
        return {...column, width: columnsWidthSetup[column.name] ?? column.width};
    });
}

interface ResizeablePaginatedTableProps<T> extends Omit<PaginatedTableProps<T>, 'onColumnsResize'> {
    columnsWidthLSKey: string;
}

export function ResizeablePaginatedTable<T>({
    columnsWidthLSKey,
    columns,
    ...props
}: ResizeablePaginatedTableProps<T>) {
    const [tableColumnsWidth, setTableColumnsWidth] = useTableResize(columnsWidthLSKey);

    const updatedColumns = updateColumnsWidth(columns, tableColumnsWidth);

    return (
        <PaginatedTable
            columns={updatedColumns}
            onColumnsResize={setTableColumnsWidth}
            {...props}
        />
    );
}
