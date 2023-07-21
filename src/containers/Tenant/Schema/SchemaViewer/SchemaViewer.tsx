import cn from 'bem-cn-lite';

import DataTable, {Column} from '@gravity-ui/react-data-table';

import type {TColumnDescription} from '../../../../types/api/schema';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';

import {Icon} from '../../../../components/Icon';

import './SchemaViewer.scss';

const b = cn('schema-viewer');

const SchemaViewerColumns = {
    id: 'Id',
    name: 'Name',
    key: 'Key',
    type: 'Type',
    notNull: 'NotNull',
};

interface SchemaViewerProps {
    keyColumnIds?: number[];
    columns?: TColumnDescription[];
}

export const SchemaViewer = ({keyColumnIds = [], columns = []}: SchemaViewerProps) => {
    const dataTableColumns: Column<TColumnDescription>[] = [
        {
            name: SchemaViewerColumns.id,
            width: 40,
        },
        {
            name: SchemaViewerColumns.key,
            width: 40,
            sortAccessor: (row) => {
                return row.Id && keyColumnIds.includes(row.Id) ? 1 : 0;
            },
            render: ({row}) => {
                return row.Id && keyColumnIds.includes(row.Id) ? (
                    <div className={b('key-icon')}>
                        <Icon name="key" viewBox="0 0 12 7" width={12} height={7} />
                    </div>
                ) : null;
            },
        },
        {
            name: SchemaViewerColumns.name,
            width: 100,
        },
        {
            name: SchemaViewerColumns.type,
            width: 100,
        },
        {
            name: SchemaViewerColumns.notNull,
            width: 100,
            render: ({row}) => {
                if (row.NotNull) {
                    return '\u2713';
                }

                return undefined;
            },
        },
    ];

    // Display key columns first
    const tableData = columns.sort((column) => {
        if (column.Id && keyColumnIds.includes(column.Id)) {
            return 1;
        }
        return -1;
    });

    return (
        <div className={b()}>
            <DataTable
                theme="yandex-cloud"
                data={tableData}
                columns={dataTableColumns}
                settings={DEFAULT_TABLE_SETTINGS}
                initialSortOrder={{columnId: SchemaViewerColumns.key, order: DataTable.DESCENDING}}
            />
        </div>
    );
};

export default SchemaViewer;
