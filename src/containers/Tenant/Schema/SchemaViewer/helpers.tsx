import type {ClassNameFormatter} from '@bem-react/classname';
import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';

import {Icon} from '../../../../components/Icon';
import type {
    EPathType,
    TColumnDescription,
    TColumnTableDescription,
    TEvDescribeSchemeResult,
    TFamilyDescription,
} from '../../../../types/api/schema';
import {EColumnCodec} from '../../../../types/api/schema';
import {isColumnEntityType, isExternalTable, isRowTable, isTableType} from '../../utils/schema';

export const SchemaViewerColumns = {
    id: 'Id',
    name: 'Name',
    key: 'Key',
    type: 'Type',
    notNull: 'NotNull',
    familyName: 'Family',
    preferredPoolKind: 'Media',
    columnCodec: 'Compression',
};

function prepareOlapTableSchema(tableSchema: TColumnTableDescription = {}) {
    const {Name, Schema} = tableSchema;

    if (Schema) {
        const {Columns, KeyColumnNames} = Schema;
        const KeyColumnIds = KeyColumnNames?.map((name: string) => {
            const column = Columns?.find((el) => el.Name === name);
            return column?.Id;
        }).filter((id): id is number => id !== undefined);

        return {
            Columns,
            KeyColumnNames,
            Name,
            KeyColumnIds,
        };
    }

    return {
        Name,
    };
}

function formatColumnCodec(codec?: EColumnCodec) {
    if (!codec) {
        return null;
    }
    if (codec === EColumnCodec.ColumnCodecPlain) {
        return 'None';
    }
    return codec.replace('ColumnCodec', '').toLocaleLowerCase();
}

export function prepareColumnDescriptions(
    type?: EPathType,
    scheme?: TEvDescribeSchemeResult,
): {columns: TColumnDescription[]; keyColumnIds: number[]} {
    let keyColumnIds: number[] = [];
    let columns: TColumnDescription[] = [];

    if (isTableType(type) && isColumnEntityType(type)) {
        const description = scheme?.PathDescription?.ColumnTableDescription;
        const columnTableSchema = prepareOlapTableSchema(description);
        keyColumnIds = columnTableSchema.KeyColumnIds ?? [];
        columns = columnTableSchema.Columns ?? [];
    } else if (isExternalTable(type)) {
        columns = scheme?.PathDescription?.ExternalTableDescription?.Columns ?? [];
    } else {
        keyColumnIds = scheme?.PathDescription?.Table?.KeyColumnIds ?? [];
        columns = scheme?.PathDescription?.Table?.Columns ?? [];
    }

    return {columns, keyColumnIds};
}

export function prepareFamilies(
    scheme?: TEvDescribeSchemeResult,
): Record<number, TFamilyDescription> {
    return (
        scheme?.PathDescription?.Table?.PartitionConfig?.ColumnFamilies?.reduce<
            Record<number, TFamilyDescription>
        >((acc, family) => {
            if (family.Id) {
                acc[family.Id] = family;
            }
            return acc;
        }, {}) ?? {}
    );
}

export function prepareSchemaTableColumns(options: {
    type?: EPathType;
    b: ClassNameFormatter;
    families: Record<number, TFamilyDescription>;
    keyColumnIds: number[];
    withFamilies: boolean;
}): Column<TColumnDescription>[] {
    const keyColumnsOrderValues = options.keyColumnIds.reduce<Record<number, number>>(
        (result, keyColumnId, index) => {
            // Put columns with negative values, so they will be the first with ascending sort
            // Minus keyColumnIds.length for the first key, -1 for the last
            result[keyColumnId] = index - options.keyColumnIds.length;
            return result;
        },
        {},
    );

    const columns: Column<TColumnDescription>[] = [
        {
            name: SchemaViewerColumns.id,
            width: 40,
        },
    ];

    if (!isExternalTable(options.type)) {
        // External tables don't have key columns
        columns.push({
            name: SchemaViewerColumns.key,
            width: 40,
            // Table should start with key columns on sort click
            defaultOrder: DataTable.ASCENDING,
            // Values in keyColumnsOrderValues are always negative, so it will be 1 for not key columns
            sortAccessor: (row) => (row.Id && keyColumnsOrderValues[row.Id]) || 1,
            render: ({row}) => {
                return row.Id && options.keyColumnIds.includes(row.Id) ? (
                    <div className={options.b('key-icon')}>
                        <Icon name="key" viewBox="0 0 12 7" width={12} height={7} />
                    </div>
                ) : null;
            },
        });
    }

    columns.push(
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

    if (options.withFamilies && isRowTable(options.type)) {
        columns.push(
            {
                name: SchemaViewerColumns.familyName,
                width: 100,
                render: ({row}) => (row.Family ? options.families[row.Family].Name : undefined),
                sortAccessor: (row) => (row.Family ? options.families[row.Family].Name : undefined),
            },
            {
                name: SchemaViewerColumns.preferredPoolKind,
                width: 100,
                render: ({row}) =>
                    row.Family
                        ? options.families[row.Family].StorageConfig?.Data?.PreferredPoolKind
                        : undefined,
                sortAccessor: (row) =>
                    row.Family
                        ? options.families[row.Family].StorageConfig?.Data?.PreferredPoolKind
                        : undefined,
            },
            {
                name: SchemaViewerColumns.columnCodec,
                width: 100,
                render: ({row}) =>
                    row.Family
                        ? formatColumnCodec(options.families[row.Family].ColumnCodec)
                        : undefined,
                sortAccessor: (row) =>
                    row.Family ? options.families[row.Family].ColumnCodec : undefined,
            },
        );
    }

    return columns;
}
