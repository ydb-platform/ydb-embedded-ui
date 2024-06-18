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

function getKeyColumnsSortAccessorMap<T extends number | string>(ids: T[] = []): Record<T, number> {
    return ids.reduce(
        (result, keyColumnId, index) => {
            // Put columns with negative values, so they will be the first with ascending sort
            // Minus keyColumnIds.length for the first key, -1 for the last
            return {
                ...result,
                [keyColumnId]: index - ids.length,
            };
        },
        {} as Record<T, number>,
    );
}

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

    const keyAccessorsMap = getKeyColumnsSortAccessorMap(KeyColumnIds);

    const preparedColumns = Columns?.map((column) => {
        const {Id, Name, NotNull, Type, Family, DefaultFromSequence} = column;

        const isKeyColumn = Boolean(KeyColumnIds?.find((keyColumnId) => keyColumnId === Id));
        // Values in keyAccessorsMap are always negative, so it will be 1 for not key columns
        const keyAccessor = Id && keyAccessorsMap[Id] ? keyAccessorsMap[Id] : 1;

        const familyName = Family ? families[Family].Name : undefined;
        const prefferedPoolKind = Family
            ? families[Family].StorageConfig?.Data?.PreferredPoolKind
            : undefined;
        const columnCodec = Family ? formatColumnCodec(families[Family].ColumnCodec) : undefined;

        return {
            id: Id,
            name: Name,
            isKeyColumn,
            keyAccessor,
            type: Type,
            notNull: NotNull,
            autoIncrement: Boolean(DefaultFromSequence),
            familyName,
            prefferedPoolKind,
            columnCodec,
        };
    });

    return preparedColumns || [];
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
    const {Schema = {}} = data;
    const {Columns, KeyColumnNames} = Schema;

    const keyAccessorsMap = getKeyColumnsSortAccessorMap(KeyColumnNames);

    const preparedColumns = Columns?.map((column) => {
        const {Id, Name, Type, NotNull} = column;

        const isKeyColumn = Boolean(
            KeyColumnNames?.find((keyColumnName) => keyColumnName === Name),
        );

        // Values in keyAccessorsMap are always negative, so it will be 1 for not key columns
        const keyAccessor = Name && keyAccessorsMap[Name] ? keyAccessorsMap[Name] : 1;

        return {
            id: Id,
            name: Name,
            isKeyColumn,
            keyAccessor,
            type: Type,
            notNull: NotNull,
        };
    });

    return preparedColumns || [];
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
