import type {DataTableProps, Settings} from '@gravity-ui/react-data-table';
import DataTable, {updateColumnsWidth} from '@gravity-ui/react-data-table';

import {cn} from '../../utils/cn';
import {useTableResize} from '../../utils/hooks/useTableResize';

import './ResizeableDataTable.scss';

const b = cn('ydb-resizeable-data-table');

export interface ResizeableDataTableProps<T> extends Omit<DataTableProps<T>, 'theme' | 'onResize'> {
    columnsWidthLSKey?: string;
    wrapperClassName?: string;
}

export function ResizeableDataTable<T>({
    columnsWidthLSKey,
    columns,
    settings,
    wrapperClassName,
    ...props
}: ResizeableDataTableProps<T>) {
    const [tableColumnsWidth, setTableColumnsWidth] = useTableResize(columnsWidthLSKey);

    const updatedColumns = updateColumnsWidth(columns, tableColumnsWidth);

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
                settings={newSettings}
                {...props}
            />
        </div>
    );
}
