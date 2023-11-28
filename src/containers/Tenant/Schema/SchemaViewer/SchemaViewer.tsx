import {useMemo} from 'react';
import cn from 'bem-cn-lite';

import DataTable, {Column} from '@gravity-ui/react-data-table';

import type {EPathType, TColumnDescription} from '../../../../types/api/schema';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';

import {Icon} from '../../../../components/Icon';

import {isExternalTable} from '../../utils/schema';

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
    type?: EPathType;
}

export const SchemaViewer = ({keyColumnIds = [], columns = [], type}: SchemaViewerProps) => {
    // Keys should be displayd by their order in keyColumnIds (Primary Key)
    const keyColumnsOrderValues = useMemo(() => {
        return keyColumnIds.reduce<Record<number, number>>((result, keyColumnId, index) => {
            // Put columns with negative values, so they will be the first with ascending sort
            // Minus keyColumnIds.length for the first key, -1 for the last
            result[keyColumnId] = index - keyColumnIds.length;
            return result;
        }, {});
    }, [keyColumnIds]);

    let dataTableColumns: Column<TColumnDescription>[] = [
        {
            name: SchemaViewerColumns.id,
            width: 40,
        },
        {
            name: SchemaViewerColumns.key,
            width: 40,
            // Table should start with key columns on sort click
            defaultOrder: DataTable.ASCENDING,
            sortAccessor: (row) => {
                // Values in keyColumnsOrderValues are always negative, so it will be 1 for not key columns
                return (row.Id && keyColumnsOrderValues[row.Id]) || 1;
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
            // Table should start with notNull columns on sort click
            defaultOrder: DataTable.DESCENDING,
            render: ({row}) => {
                if (row.NotNull) {
                    return '\u2713';
                }

                return undefined;
            },
        },
    ];

    if (isExternalTable(type)) {
        // External tables don't have key columns
        dataTableColumns = dataTableColumns.filter(
            (column) => column.name !== SchemaViewerColumns.key,
        );
    }

    return (
        <div className={b()}>
            <DataTable
                theme="yandex-cloud"
                data={columns}
                columns={dataTableColumns}
                settings={DEFAULT_TABLE_SETTINGS}
                initialSortOrder={{columnId: SchemaViewerColumns.key, order: DataTable.ASCENDING}}
            />
        </div>
    );
};

export default SchemaViewer;
