import type {ColumnWidthByName} from '@gravity-ui/react-data-table';

import {useTableResize} from '../../utils/hooks/useTableResize';

import type {PaginatedTableProps} from './PaginatedTable';
import {PaginatedTable} from './PaginatedTable';
import {b} from './shared';
import type {Column} from './types';

function updateColumnsWidth<EntityType>(
    columns: Column<EntityType>[],
    columnsWidthSetup: ColumnWidthByName,
) {
    return columns.map((column) => {
        return {...column, width: columnsWidthSetup[column.name] ?? column.width};
    });
}

interface ResizeablePaginatedTableProps<EntityType, Filters, DataFieldType>
    extends Omit<PaginatedTableProps<EntityType, Filters, DataFieldType>, 'onColumnsResize'> {
    columnsWidthLSKey: string;
}

export function ResizeablePaginatedTable<EntityType, Filters, DataFieldType>({
    columnsWidthLSKey,
    columns,
    ...props
}: ResizeablePaginatedTableProps<EntityType, Filters, DataFieldType>) {
    const [tableColumnsWidth, setTableColumnsWidth] = useTableResize(columnsWidthLSKey);

    const updatedColumns = updateColumnsWidth(columns, tableColumnsWidth);

    return (
        <PaginatedTable
            columns={updatedColumns}
            onColumnsResize={setTableColumnsWidth}
            containerClassName={b('resizeable-table-container')}
            {...props}
        />
    );
}
