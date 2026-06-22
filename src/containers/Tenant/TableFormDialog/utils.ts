import type {SelectOption} from '@gravity-ui/uikit';

import {SERIAL_TYPES_MAP} from '../../../store/reducers/table/constants';
import {prepareFormValues} from '../../../store/reducers/table/utils';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema/schema';
import {EPathType} from '../../../types/api/schema/schema';
import type {TColumnDescription} from '../../../types/api/schema/shared';

import {MAX_PARTITION_SIZE_MB} from './constants';
import i18n from './i18n';
import type {Column, ColumnField, FormValues, OriginalTableInfo, TableType} from './types';
import {PartitionsType} from './types';

const TTL_VALID_TYPES = new Set([
    'Date',
    'Date32',
    'Datetime',
    'Datetime64',
    'Timestamp',
    'Timestamp64',
    'Uint32',
    'Uint64',
]);

const TTL_NUM_TYPES = new Set(['Uint32', 'Uint64']);

export function isValidTtlType(type: string | undefined) {
    return Boolean(type && TTL_VALID_TYPES.has(type));
}

export function isValidTtlNumType(type: string | undefined) {
    return Boolean(type && TTL_NUM_TYPES.has(type));
}

export const epochModeOptions: SelectOption[] = [
    {value: 'seconds', content: i18n('value_epoch-seconds')},
    {value: 'milliseconds', content: i18n('value_epoch-milliseconds')},
    {value: 'microseconds', content: i18n('value_epoch-microseconds')},
    {value: 'nanoseconds', content: i18n('value_epoch-nanoseconds')},
];

export const lifetimeUnitOptions: SelectOption[] = [
    {value: 'seconds', content: i18n('value_seconds')},
    {value: 'minutes', content: i18n('value_minutes')},
    {value: 'hours', content: i18n('value_hours')},
    {value: 'days', content: i18n('value_days')},
];

export const ttlStatusOptions = [
    {value: 'disabled', content: i18n('value_disabled')},
    {value: 'enabled', content: i18n('value_enabled')},
];

export const partitionsTypeOptions = [
    {value: PartitionsType.None, content: i18n('value_partitions-none')},
    {value: PartitionsType.Uniform, content: i18n('value_partitions-uniform')},
    {value: PartitionsType.Explicit, content: i18n('value_partitions-explicit')},
];

let columnIdCounter = 0;
export function generateColumnId() {
    columnIdCounter += 1;
    return `col_${Date.now().toString(36)}_${columnIdCounter}`;
}

export function getInitialColumns(type: TableType): ColumnField[] {
    return [
        {
            _id: generateColumnId(),
            name: 'id',
            type: 'Int64',
            key: true,
            notNull: type === 'column',
            defaultValue: '',
            withDefaultValue: false,
        },
    ];
}

export function getCreateInitialValues(initialType: TableType = 'row'): FormValues {
    const columns = getInitialColumns(initialType);
    const firstName = columns[0]?.name ?? '';

    return {
        name: '',
        type: initialType,
        columns,
        secondaryIndexes: [],
        deletedColumns: [],
        partitionKey: firstName ? [firstName] : [],
        partitionCount: 64,
        settings: {
            partitionsType: PartitionsType.None,
            uniformPartitions: undefined,
            partitionsAtKeys: [],
            autoPartitionBySize: true,
            autoPartitionByLoad: false,
            autoPartitionBySizeMb: MAX_PARTITION_SIZE_MB,
            keyBloomFilter: false,
            ttl: {status: 'disabled'},
        },
    };
}

export function getUpdateInitialValues(table: TEvDescribeSchemeResult): FormValues {
    return prepareFormValues(table);
}

type DescribedColumn = Pick<
    TColumnDescription,
    'Name' | 'Type' | 'NotNull' | 'DefaultFromLiteral'
> & {
    DefaultFromSequence?: string;
    DefaultValue?: unknown;
};

function getColumnDefaultValue(column: DescribedColumn) {
    const literalValue = column.DefaultFromLiteral?.value;
    if (literalValue) {
        return Object.values(literalValue)[0] as string | number | boolean;
    }

    if (
        typeof column.DefaultValue === 'string' ||
        typeof column.DefaultValue === 'number' ||
        typeof column.DefaultValue === 'boolean'
    ) {
        return column.DefaultValue;
    }

    return undefined;
}

function describeColumn(column: DescribedColumn, keyColumnNames: string[]): Column {
    const name = column.Name ?? '';
    const keyOrder = keyColumnNames.indexOf(name);

    return {
        name,
        type: column.Type ?? '',
        notNull: column.NotNull ?? false,
        key: keyOrder >= 0,
        keyOrder: keyOrder >= 0 ? keyOrder : undefined,
        autoincrement: Boolean(column.DefaultFromSequence),
        defaultValue: getColumnDefaultValue(column),
    };
}

function sortColumnsByKeyOrder<T extends {key?: boolean; keyOrder?: number}>(columns: T[]): T[] {
    const keys = columns.filter((c) => c.key);
    const others = columns.filter((c) => !c.key);
    keys.sort((a, b) => {
        const ao = a.keyOrder ?? 0;
        const bo = b.keyOrder ?? 0;
        return ao - bo;
    });
    return [...keys, ...others];
}

export function describeOriginalTable(
    table: TEvDescribeSchemeResult | undefined,
): OriginalTableInfo | undefined {
    if (!table) {
        return undefined;
    }
    const pathDesc = table.PathDescription;
    const name = pathDesc?.Self?.Name ?? '';
    const pathType = pathDesc?.Self?.PathType;

    if (pathType === EPathType.EPathTypeColumnTable && pathDesc?.ColumnTableDescription) {
        const desc = pathDesc.ColumnTableDescription;
        const keyColumnNames = desc.Schema?.KeyColumnNames ?? [];
        const columns = sortColumnsByKeyOrder(
            (desc.Schema?.Columns ?? []).map((col) => describeColumn(col, keyColumnNames)),
        );
        return {
            name,
            type: 'column',
            columns,
            partitionKey: desc.Sharding?.HashSharding?.Columns ?? [],
            indexes: [],
            hasTtl: Boolean(desc.TtlSettings?.Enabled),
            hasMinPartitions: false,
            hasMaxPartitions: false,
        };
    }

    const desc = pathDesc?.Table;
    const keyColumnNames = desc?.KeyColumnNames ?? [];
    const columns = sortColumnsByKeyOrder(
        (desc?.Columns ?? []).map((col) => describeColumn(col, keyColumnNames)),
    );

    const indexes = (desc?.TableIndexes ?? []).map((idx) => ({
        name: idx.Name ?? '',
        columns: idx.KeyColumnNames ?? [],
    }));

    return {
        name,
        type: 'row',
        columns,
        partitionKey: [],
        indexes,
        hasTtl: Boolean(desc?.TTLSettings?.Enabled),
        hasMinPartitions:
            typeof desc?.PartitionConfig?.PartitioningPolicy?.MinPartitionsCount !== 'undefined',
        hasMaxPartitions:
            typeof desc?.PartitionConfig?.PartitioningPolicy?.MaxPartitionsCount !== 'undefined',
    };
}

export function getNotNullDisabledMessage(
    column: ColumnField,
    keyNullable: boolean,
): string | undefined {
    if (!keyNullable && column.key) {
        return i18n('label_not-null-note-key');
    }
    if (column.autoincrement) {
        return i18n('label_not-null-note-autoincrement');
    }
    return undefined;
}

export function getAutoincrementDisabledMessage(column: ColumnField): string | undefined {
    if (!column.key || (column.type && !Object.keys(SERIAL_TYPES_MAP).includes(column.type))) {
        return i18n('label_autoincrement-note-type');
    }
    return undefined;
}

export function isSerialCompatible(type: string | undefined) {
    return Boolean(type && Object.keys(SERIAL_TYPES_MAP).includes(type));
}

export function acceptIntegerInput(value: string) {
    return value === '' || /^(0|[1-9][0-9]*)$/.test(value);
}

export function formatOptionalIntegerInput(value?: number) {
    return value === undefined || Number.isNaN(value) ? '' : String(value);
}

export function parseOptionalIntegerInput(value: string) {
    return value === '' ? Number.NaN : Number(value);
}

const columnTypeDescriptions: Record<string, string> = {
    Bool: i18n('context_type-bool'),
    Int8: i18n('context_type-int8'),
    Int16: i18n('context_type-int16'),
    Int32: i18n('context_type-int32'),
    Int64: i18n('context_type-int64'),
    Uint8: i18n('context_type-uint8'),
    Uint16: i18n('context_type-uint16'),
    Uint32: i18n('context_type-uint32'),
    Uint64: i18n('context_type-uint64'),
    'Decimal(22,9)': i18n('context_type-decimal22-9'),
    Float: i18n('context_type-float'),
    Double: i18n('context_type-double'),
    String: i18n('context_type-string'),
    Utf8: i18n('context_type-utf8'),
    Json: i18n('context_type-json'),
    JsonDocument: i18n('context_type-jsondocument'),
    Date: i18n('context_type-date'),
    Date32: i18n('context_type-date'),
    Datetime: i18n('context_type-datetime'),
    Datetime64: i18n('context_type-datetime'),
    Timestamp: i18n('context_type-timestamp'),
    Timestamp64: i18n('context_type-timestamp'),
    Interval: i18n('context_type-interval'),
    Interval64: i18n('context_type-interval'),
    Uuid: i18n('context_type-uuid'),
};

export function getColumnTypeDescription(type: string): string | undefined {
    return columnTypeDescriptions[type];
}
