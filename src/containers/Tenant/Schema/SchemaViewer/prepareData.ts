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
import type {Nullable} from '../../../../utils/typecheckers';
import {
    isColumnEntityType,
    isExternalTableType,
    isRowTableType,
    isSystemViewType,
} from '../../utils/schema';

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

function prepareFamilies(data?: TTableDescription): Record<number, TFamilyDescription> {
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

    const {Columns, KeyColumnNames} = data;

    const preparedColumns = Columns?.map((column) => {
        const {Id, Name, NotNull, Type, Family, DefaultFromSequence, DefaultFromLiteral} = column;

        const keyColumnIndex =
            KeyColumnNames?.findIndex((keyColumnName) => keyColumnName === Name) ?? -1;

        const familyName = Family ? families[Family].Name : undefined;
        const prefferedPoolKind = Family
            ? families[Family].StorageConfig?.Data?.PreferredPoolKind
            : undefined;
        const columnCodec = Family ? formatColumnCodec(families[Family].ColumnCodec) : undefined;

        return {
            id: Id,
            name: Name,
            keyColumnIndex,
            type: Type,
            notNull: NotNull,
            autoIncrement: Boolean(DefaultFromSequence),
            defaultValue: Object.values(DefaultFromLiteral?.value || {})[0] ?? '-',
            familyName,
            prefferedPoolKind,
            columnCodec,
        };
    });

    return preparedColumns ?? [];
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

        const keyColumnIndex =
            KeyColumnNames?.findIndex((keyColumnName) => keyColumnName === Name) ?? -1;

        const partitioningColumnIndex =
            HashColumns?.findIndex((hashColumnName) => hashColumnName === Name) ?? -1;

        return {
            id: Id,
            name: Name,
            keyColumnIndex,
            partitioningColumnIndex,
            type: Type,
            notNull: NotNull,
        };
    });

    const keyColumns = preparedColumns?.filter((column) => column.keyColumnIndex !== -1) || [];
    const otherColumns = preparedColumns?.filter((column) => column.keyColumnIndex === -1) || [];

    return [...keyColumns, ...otherColumns];
}

export function prepareSchemaData(
    type?: EPathType,
    schema?: Nullable<TEvDescribeSchemeResult>,
): SchemaData[] {
    const {Table, ColumnTableDescription, ExternalTableDescription} = schema?.PathDescription || {};

    if (isRowTableType(type) || isSystemViewType(type)) {
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
