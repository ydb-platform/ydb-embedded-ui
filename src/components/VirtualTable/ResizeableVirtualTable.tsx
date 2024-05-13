import type {ColumnWidthByName} from '@gravity-ui/react-data-table';

import {useTableResize} from '../../utils/hooks/useTableResize';

import type {VirtualTableProps} from './VirtualTable';
import {VirtualTable} from './VirtualTable';
import type {Column} from './types';

function updateColumnsWidth<T>(columns: Column<T>[], columnsWidthSetup: ColumnWidthByName) {
    return columns.map((column) => {
        return {...column, width: columnsWidthSetup[column.name] ?? column.width};
    });
}

interface ResizeableVirtualTableProps<T> extends Omit<VirtualTableProps<T>, 'onColumnsResize'> {
    columnsWidthLSKey: string;
}

export function ResizeableVirtualTable<T>({
    columnsWidthLSKey,
    columns,
    ...props
}: ResizeableVirtualTableProps<T>) {
    const [tableColumnsWidth, setTableColumnsWidth] = useTableResize(columnsWidthLSKey);

    const updatedColumns = updateColumnsWidth(columns, tableColumnsWidth);

    return (
        <VirtualTable columns={updatedColumns} onColumnsResize={setTableColumnsWidth} {...props} />
    );
}
