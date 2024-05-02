import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';

import {Icon} from '../../../../components/Icon';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import type {EPathType, TColumnDescription, TFamilyDescription} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useTypedSelector} from '../../../../utils/hooks';
import {isColumnEntityType, isExternalTable, isRowTable, isTableType} from '../../utils/schema';

import {formatColumnCodec, prepareOlapTableSchema} from './helpers';

import './SchemaViewer.scss';

const b = cn('schema-viewer');

const SchemaViewerColumns = {
    id: 'Id',
    name: 'Name',
    key: 'Key',
    type: 'Type',
    notNull: 'NotNull',
    familyName: 'Family',
    preferredPoolKind: 'Media',
    columnCodec: 'Compression',
};

interface SchemaViewerProps {
    className?: string;
    type?: EPathType;
    path?: string;
    withFamilies?: boolean;
}

export const SchemaViewer = ({className, type, path, withFamilies}: SchemaViewerProps) => {
    const {data, loading} = useTypedSelector((state) => state.schema);
    const currentObjectData = path ? data[path] : undefined;

    let keyColumnIds: number[] = [];
    let columns: TColumnDescription[] = [];

    if (isTableType(type) && isColumnEntityType(type)) {
        const description = currentObjectData?.PathDescription?.ColumnTableDescription;
        const columnTableSchema = prepareOlapTableSchema(description);
        keyColumnIds = columnTableSchema.KeyColumnIds ?? [];
        columns = columnTableSchema.Columns ?? [];
    } else if (isExternalTable(type)) {
        columns = currentObjectData?.PathDescription?.ExternalTableDescription?.Columns ?? [];
    } else {
        keyColumnIds = currentObjectData?.PathDescription?.Table?.KeyColumnIds ?? [];
        columns = currentObjectData?.PathDescription?.Table?.Columns ?? [];
    }

    const families =
        currentObjectData?.PathDescription?.Table?.PartitionConfig?.ColumnFamilies?.reduce<
            Record<number, TFamilyDescription>
        >((acc, family) => {
            if (family.Id) {
                acc[family.Id] = family;
            }
            return acc;
        }, {}) ?? {};

    // Keys should be displayd by their order in keyColumnIds (Primary Key)
    const keyColumnsOrderValues = React.useMemo(() => {
        return keyColumnIds.reduce<Record<number, number>>((result, keyColumnId, index) => {
            // Put columns with negative values, so they will be the first with ascending sort
            // Minus keyColumnIds.length for the first key, -1 for the last
            result[keyColumnId] = index - keyColumnIds.length;
            return result;
        }, {});
    }, [keyColumnIds]);

    const dataTableColumns: Column<TColumnDescription>[] = [
        {
            name: SchemaViewerColumns.id,
            width: 40,
        },
    ];

    if (!isExternalTable(type)) {
        // External tables don't have key columns
        dataTableColumns.push({
            name: SchemaViewerColumns.key,
            width: 40,
            // Table should start with key columns on sort click
            defaultOrder: DataTable.ASCENDING,
            // Values in keyColumnsOrderValues are always negative, so it will be 1 for not key columns
            sortAccessor: (row) => (row.Id && keyColumnsOrderValues[row.Id]) || 1,
            render: ({row}) => {
                return row.Id && keyColumnIds.includes(row.Id) ? (
                    <div className={b('key-icon')}>
                        <Icon name="key" viewBox="0 0 12 7" width={12} height={7} />
                    </div>
                ) : null;
            },
        });
    }

    dataTableColumns.push(
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
    );

    if (withFamilies && isRowTable(type)) {
        dataTableColumns.push(
            {
                name: SchemaViewerColumns.familyName,
                width: 100,
                render: ({row}) => (row.Family ? families[row.Family].Name : undefined),
                sortAccessor: (row) => (row.Family ? families[row.Family].Name : undefined),
            },
            {
                name: SchemaViewerColumns.preferredPoolKind,
                width: 100,
                render: ({row}) =>
                    row.Family
                        ? families[row.Family].StorageConfig?.Data?.PreferredPoolKind
                        : undefined,
                sortAccessor: (row) =>
                    row.Family
                        ? families[row.Family].StorageConfig?.Data?.PreferredPoolKind
                        : undefined,
            },
            {
                name: SchemaViewerColumns.columnCodec,
                width: 100,
                render: ({row}) =>
                    row.Family ? formatColumnCodec(families[row.Family].ColumnCodec) : undefined,
                sortAccessor: (row) => (row.Family ? families[row.Family].ColumnCodec : undefined),
            },
        );
    }

    return (
        <div className={b(null, className)}>
            {loading ? (
                <TableSkeleton />
            ) : (
                <DataTable
                    theme="yandex-cloud"
                    data={columns}
                    columns={dataTableColumns}
                    settings={DEFAULT_TABLE_SETTINGS}
                    initialSortOrder={{
                        columnId: SchemaViewerColumns.key,
                        order: DataTable.ASCENDING,
                    }}
                />
            )}
        </div>
    );
};
