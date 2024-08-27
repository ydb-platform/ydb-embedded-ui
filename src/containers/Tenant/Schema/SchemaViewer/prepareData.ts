import type {ColumnType} from '../../../../types/api/query';
import type {
    EPathType,
    TColumnTableDescription,
    TEvDescribeSchemeResult,
    TExternalTableDescription,
    TFamilyDescription,
    TTableDescription,
} from '../../../../types/api/schema';
import {EColumnCodec} from '../../../../types/api/schema';
import {isColumnEntityType, isExternalTableType, isRowTableType} from '../../utils/schema';

import type {SchemaData} from './types';

function formatColumnCodec(codec?: EColumnCodec) {
    if (!codec) {
        return undefined;
    }
    if (codec === EColumnCodec.ColumnCodecPlain) {
        return 'None';
    }
    return codec.replace('ColumnCodec', '').toLocaleLowerCase();
}

export function prepareFamilies(data?: TTableDescription): Record<number, TFamilyDescription> {
    return (
        data?.PartitionConfig?.ColumnFamilies?.reduce<Record<number, TFamilyDescription>>(
            (acc, family) => {
                if (family.Id) {
                    return {
                        ...acc,
                        [family.Id]: family,
                    };
                }
                return acc;
            },
            {},
        ) ?? {}
    );
}

function prepareRowTableSchema(data: TTableDescription = {}): SchemaData[] {
    const families = prepareFamilies(data);

    const {Columns, KeyColumnIds} = data;

    const preparedColumns = Columns?.map((column) => {
        const {Id, Name, NotNull, Type, Family, DefaultFromSequence, DefaultFromLiteral} = column;

        const isKeyColumn = Boolean(KeyColumnIds?.find((keyColumnId) => keyColumnId === Id));

        const familyName = Family ? families[Family].Name : undefined;
        const prefferedPoolKind = Family
            ? families[Family].StorageConfig?.Data?.PreferredPoolKind
            : undefined;
        const columnCodec = Family ? formatColumnCodec(families[Family].ColumnCodec) : undefined;

        return {
            id: Id,
            name: Name,
            isKeyColumn,
            type: Type,
            notNull: NotNull,
            autoIncrement: Boolean(DefaultFromSequence),
            defaultValue: Object.values(DefaultFromLiteral?.value || {})[0] || '-',
            familyName,
            prefferedPoolKind,
            columnCodec,
        };
    });
    const keyColumns = preparedColumns?.filter((column) => column.isKeyColumn) || [];
    const otherColumns = preparedColumns?.filter((column) => !column.isKeyColumn) || [];

    return [...keyColumns, ...otherColumns];
}

function prepareExternalTableSchema(data: TExternalTableDescription = {}): SchemaData[] {
    const {Columns} = data;
    const preparedColumns = Columns?.map((column) => {
        const {Id, Name, Type, NotNull} = column;
        return {
            id: Id,
            name: Name,
            type: Type,
            notNull: NotNull,
        };
    });

    return preparedColumns || [];
}

function prepareColumnTableSchema(data: TColumnTableDescription = {}): SchemaData[] {
    const {Schema = {}, Sharding = {}} = data;
    const {Columns, KeyColumnNames} = Schema;
    const {HashSharding = {}} = Sharding;
    const {Columns: HashColumns = []} = HashSharding;

    const preparedColumns = Columns?.map((column) => {
        const {Id, Name, Type, NotNull} = column;

        const isKeyColumn = Boolean(
            KeyColumnNames?.find((keyColumnName) => keyColumnName === Name),
        );
        const isPartitioningKeyColumn = Boolean(
            HashColumns?.find((hashColumnName) => hashColumnName === Name),
        );

        return {
            id: Id,
            name: Name,
            isKeyColumn,
            isPartitioningKeyColumn,
            type: Type,
            notNull: NotNull,
        };
    });

    const keyColumns = preparedColumns?.filter((column) => column.isKeyColumn) || [];
    const otherColumns = preparedColumns?.filter((column) => !column.isKeyColumn) || [];

    return [...keyColumns, ...otherColumns];
}

export function prepareSchemaData(
    type?: EPathType,
    schema?: TEvDescribeSchemeResult,
): SchemaData[] {
    const {Table, ColumnTableDescription, ExternalTableDescription} = schema?.PathDescription || {};

    if (isRowTableType(type)) {
        return prepareRowTableSchema(Table);
    } else if (isColumnEntityType(type)) {
        return prepareColumnTableSchema(ColumnTableDescription);
    } else if (isExternalTableType(type)) {
        return prepareExternalTableSchema(ExternalTableDescription);
    }

    return [];
}

export function prepareViewSchema(columns?: ColumnType[]): SchemaData[] {
    const preparedColumns = columns?.map((column) => {
        // View may have columns like Uint64? or Utf8?
        const type = column.type?.endsWith('?') ? column.type.slice(0, -1) : column.type;

        return {
            type,
            name: column.name,
        };
    });

    return preparedColumns || [];
}
