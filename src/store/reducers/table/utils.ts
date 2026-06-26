import {duration} from '@gravity-ui/date-utils';

import type {TColumnTableDescription} from '../../../types/api/schema/columnEntity';
import {EPathType} from '../../../types/api/schema/schema';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema/schema';
import {EColumnCodec, EUnit} from '../../../types/api/schema/shared';
import type {TTableDescription} from '../../../types/api/schema/table';

import {
    CREATE_COLUMN_TABLE_QUERY_TEMPLATE,
    CREATE_TABLE_QUERY_TEMPLATE,
    NAME_REGEX,
    SECONDS_A_DAY,
    SERIAL_TYPES_MAP,
    UPDATE_TABLE_QUERY_TEMPLATE,
} from './constants';
import {PartitionsType} from './types';
import type {
    BuildTemplateOptions,
    Column,
    ColumnFamilyDescription,
    ColumnField,
    SecondaryIndex,
    TTLSettings,
    TableFormValues,
    TableSettings,
} from './types';

type DirtyTableSettings = Partial<Record<keyof TableSettings, unknown>>;

function hasDirtyValue(value: unknown): boolean {
    if (value === true) {
        return true;
    }

    if (!value || typeof value !== 'object') {
        return false;
    }

    return Object.values(value).some(hasDirtyValue);
}

function getDurationWithDaysOnly(value: number, unit: 'seconds' | 'minutes' | 'hours' | 'days') {
    let seconds = value;

    switch (unit) {
        case 'minutes':
            seconds = value * 60;
            break;
        case 'hours':
            seconds = value * 60 * 60;
            break;
        case 'days':
            seconds = value * 60 * 60 * 24;
            break;
    }

    if (seconds < SECONDS_A_DAY) {
        return duration(value, unit).toISOString();
    } else {
        const completeDays = Math.floor(seconds / SECONDS_A_DAY);
        const incompleteDaySeconds = seconds - completeDays * SECONDS_A_DAY;
        const [, timePart = ''] =
            incompleteDaySeconds > 0
                ? duration(incompleteDaySeconds, 'seconds')
                      .shiftTo(['hours', 'minutes', 'seconds'])
                      .toISOString()
                      .split(/(T.+)/)
                : [];
        return `P${completeDays}D${timePart}`;
    }
}

function prepareEntityName(name: string) {
    return NAME_REGEX.test(name)
        ? name
        : `\`${name.replaceAll('\\', '\\\\').replaceAll('`', '\\`')}\``;
}

function prepareStringLiteralValue(value: string) {
    const escapedValue = value
        .replaceAll('\\', '\\\\')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F]/g, (controlCharacters) => {
            return '\\u' + controlCharacters.charCodeAt(0).toString(16).padStart(4, '0');
        })
        .replace(/"/g, '\\"');

    return `"${escapedValue}"`;
}

export function prepareColumnValue(column: Column, value: string | null) {
    if (value === null) {
        return 'null';
    }

    if (value.startsWith('$')) {
        return value;
    }

    switch (column.type) {
        case 'String':
        case 'Utf8':
        case 'Json': {
            return prepareStringLiteralValue(value);
        }
        case 'JsonDocument':
            return `JsonDocument(${prepareStringLiteralValue(value)})`;
        case 'Date':
        case 'Date32':
        case 'Datetime':
        case 'Datetime64':
        case 'Timestamp':
        case 'Timestamp64':
            return `${column.type}("${value}")`;
        case 'Uuid': {
            return `CAST("${value}" AS ${column.type})`;
        }
        default:
            return value;
    }
}

function prepareDefaultColumnValue(column: Column, value: string) {
    switch (column.type) {
        case 'String':
        case 'Utf8':
        case 'Json': {
            return prepareStringLiteralValue(value);
        }
        case 'JsonDocument':
            return `JsonDocument(${prepareStringLiteralValue(value)})`;
        case 'Date':
        case 'Date32':
        case 'Datetime':
        case 'Datetime64':
        case 'Timestamp':
        case 'Timestamp64':
            return `${column.type}("${value}")`;
        case 'Uuid': {
            return `CAST("${value}" AS ${column.type})`;
        }
        default:
            return value;
    }
}

const buildName = (name: string) => `\`${name.replace(/`/g, '\\`')}\``;

const buildType = (column: Column) => {
    if (column.autoincrement) {
        const serialType = SERIAL_TYPES_MAP[column.type];
        return serialType ?? column.type;
    }

    return column.type;
};

const buildNonNull = (column: Column) => (column.notNull ? 'NOT NULL' : '');

const buildDefaultValue = (column: Column) => {
    if (typeof column.defaultValue === 'undefined') {
        return '';
    }

    return `DEFAULT ${prepareDefaultColumnValue(column, String(column.defaultValue))}`;
};

const buildFamily = (column: Column) => {
    return column.family ? `FAMILY ${buildName(column.family)}` : '';
};

const buildFields = (columns: Column[]) =>
    columns.map((column) =>
        `${buildName(column.name)} ${buildType(column)} ${buildNonNull(column)} ${buildDefaultValue(column)} ${buildFamily(column)}`
            .replaceAll(/ +/g, ' ')
            .trim(),
    );

const buildNames = (columns: Column[]) => columns.map(({name}) => buildName(name));

const buildKeys = (columns: Column[]) =>
    buildNames(
        columns
            .filter(({key}) => key)
            .sort((colA, colB) => (colA.keyOrder ?? 0) - (colB.keyOrder ?? 0)),
    );

const buildPrimaryKey = (keys: string[]) =>
    keys.length > 0 ? `PRIMARY KEY (${keys.join(', ')})` : '';

const buildSecondaryIndex = ({name, key, cover}: SecondaryIndex) =>
    `INDEX ${buildName(name)} GLOBAL ON (${key.map(buildName).join(', ')})${
        cover ? ` COVER (${cover.map(buildName).join(', ')})` : ''
    }`;

const buildSettingsCreateItems = (settings?: Partial<TableSettings>) => {
    if (!settings) {
        return [];
    }

    const items = [];

    if (typeof settings.autoPartitionBySize !== 'undefined') {
        items.push(
            `AUTO_PARTITIONING_BY_SIZE = ${settings.autoPartitionBySize ? 'ENABLED' : 'DISABLED'}`,
        );
    }

    if (typeof settings.autoPartitionByLoad !== 'undefined') {
        items.push(
            `AUTO_PARTITIONING_BY_LOAD = ${settings.autoPartitionByLoad ? 'ENABLED' : 'DISABLED'}`,
        );
    }

    if (settings.autoPartitionBySize && typeof settings.autoPartitionBySizeMb !== 'undefined') {
        items.push(`AUTO_PARTITIONING_PARTITION_SIZE_MB = ${settings.autoPartitionBySizeMb}`);
    }

    if (
        typeof settings.autoPartitionMinPartitions === 'number' &&
        !Number.isNaN(settings.autoPartitionMinPartitions)
    ) {
        items.push(
            `AUTO_PARTITIONING_MIN_PARTITIONS_COUNT = ${settings.autoPartitionMinPartitions}`,
        );
    }

    if (
        typeof settings.autoPartitionMaxPartitions === 'number' &&
        !Number.isNaN(settings.autoPartitionMaxPartitions)
    ) {
        items.push(
            `AUTO_PARTITIONING_MAX_PARTITIONS_COUNT = ${settings.autoPartitionMaxPartitions}`,
        );
    }

    if (
        settings.partitionsType === PartitionsType.Uniform &&
        typeof settings.uniformPartitions === 'number' &&
        !Number.isNaN(settings.uniformPartitions)
    ) {
        items.push(`UNIFORM_PARTITIONS = ${settings.uniformPartitions}`);
    }

    if (
        settings.partitionsType === PartitionsType.Explicit &&
        settings.partitionsAtKeys &&
        settings.partitionsAtKeys.length > 0
    ) {
        items.push(
            `PARTITION_AT_KEYS = (${settings.partitionsAtKeys
                .map(
                    (v) =>
                        `(${v
                            .map((column) => prepareColumnValue(column, column.value))
                            .join(',')})`,
                )
                .join(', ')})`,
        );
    }

    if (
        settings?.ttl?.status === 'enabled' &&
        settings?.ttl?.column &&
        typeof settings.ttl.lifetime === 'number' &&
        !Number.isNaN(settings.ttl.lifetime)
    ) {
        const {column, lifetime, unit = 'seconds', epochMode} = settings.ttl;
        const ttlDuration = getDurationWithDaysOnly(lifetime, unit);
        items.push(
            `TTL = Interval("${ttlDuration}") ON ${buildName(column)}${
                epochMode ? ` AS ${formatTtlEpochMode(epochMode)}` : ''
            }`,
        );
    }

    if (typeof settings.keyBloomFilter !== 'undefined') {
        items.push(`KEY_BLOOM_FILTER = ${settings.keyBloomFilter ? 'ENABLED' : 'DISABLED'}`);
    }

    return items;
};

const buildSettingsUpdateItems = (settings?: Partial<TableSettings>, pad = ' ') => {
    const items = buildSettingsCreateItems(settings);

    return items.length > 0 ? `SET (${items.join(`,${pad}`)})` : '';
};

const buildAddColumns = (columns: Column[] = [], pad = ' ') =>
    columns
        .map(
            ({name, type, notNull}) =>
                `ADD COLUMN ${buildName(name)} ${type}${notNull ? ' NOT NULL' : ''}`,
        )
        .join(`,${pad}`);

const buildDropColumns = (columns: Column[] = [], pad = ' ') =>
    columns.map(({name}) => `DROP COLUMN ${buildName(name)}`).join(`,${pad}`);

const convertCompressionCodec = (columnFamilyDescription: ColumnFamilyDescription) => {
    switch (columnFamilyDescription?.compression) {
        case 'COMPRESSION_LZ4': {
            return 'lz4';
        }
        case 'COMPRESSION_ZSTD': {
            return 'zstd';
        }
        case 'COMPRESSION_NONE': {
            return 'off';
        }
        default: {
            return columnFamilyDescription?.compression?.split('_')?.[1]?.toLowerCase() || null;
        }
    }
};

const convertCompressionStorageDeviceType = (columnFamilyDescription: ColumnFamilyDescription) => {
    return columnFamilyDescription?.data?.media || null;
};

const buildFamilyGroups = (settings?: Partial<TableSettings>) => {
    const columnFamilies = settings?.columnFamilies || [];
    const isEmpty =
        !columnFamilies?.length ||
        (columnFamilies?.length === 1 && columnFamilies[0]?.compression === 'COMPRESSION_NONE');
    if (isEmpty) {
        return [];
    }

    return columnFamilies.map((columnFamilyDescription) => {
        const familySettings: Array<string> = [];

        const codec = convertCompressionCodec(columnFamilyDescription);
        if (codec) {
            familySettings.push(`COMPRESSION = "${codec}"`);
        }

        const storageDeviceType = convertCompressionStorageDeviceType(columnFamilyDescription);
        if (storageDeviceType) {
            familySettings.push(`DATA = "${storageDeviceType}"`);
        }

        return `FAMILY ${buildName(columnFamilyDescription.name)} (${familySettings.join(`, `)})`;
    });
};

const buildCreateScheme = ({
    columns = [],
    pad = ' ',
    secondaryIndexes = [],
    settings,
}: {
    columns?: Column[];
    pad: string | undefined;
    secondaryIndexes?: SecondaryIndex[];
    settings?: Partial<TableSettings>;
}) => {
    const fields = buildFields(columns);
    const keys = buildKeys(columns);
    const primaryKey = buildPrimaryKey(keys);
    const familyGroups = buildFamilyGroups(settings);
    const indexes = secondaryIndexes.map(buildSecondaryIndex);

    return (
        pad + [...fields, ...indexes, primaryKey, ...familyGroups].filter(Boolean).join(`,${pad}`)
    );
};

const buildColumnsHash = (columns: string[] = []) =>
    `HASH(${columns.map((col) => '`' + col.replaceAll('`', '\\`') + '`').join(', ')})`;

function buildTemplate(
    template: string,
    {
        tableName,
        columns,
        secondaryIndexes,
        deletedColumns,
        columnsHash,
        settings,
        resetItems,
        renameTo,
    }: BuildTemplateOptions,
) {
    return template
        .replace(/%tableName%/g, prepareEntityName(tableName))
        .replace(/\s*%schema%/g, (found: string) => {
            const [pad] = /^\s*/.exec(found) || [];
            return buildCreateScheme({
                columns,
                pad,
                secondaryIndexes,
                settings,
            });
        })
        .replace(/\s*%actions%/g, (found: string) => {
            const [pad = ' '] = /^\s*/.exec(found) || [];

            return (
                pad +
                [
                    ...(resetItems ?? []).map((item) => `RESET (${item})`),
                    buildDropColumns(deletedColumns, pad),
                    buildAddColumns(columns, pad),
                    buildSettingsUpdateItems(settings, pad),
                    renameTo ? `RENAME TO ${prepareEntityName(renameTo)}` : '',
                ]
                    .filter(Boolean)
                    .join(`,${pad}`) +
                ';'
            );
        })
        .replace(/%columnsHash%/g, () => {
            return buildColumnsHash(columnsHash);
        })
        .replace(/\s*%settings%/g, (found: string) => {
            const [pad = ' '] = /^\s*/.exec(found) || [];
            return pad + buildSettingsCreateItems(settings).join(`,${pad}`);
        });
}

function mapColumnCodec(codec?: EColumnCodec): string | undefined {
    switch (codec) {
        case EColumnCodec.ColumnCodecLZ4:
            return 'COMPRESSION_LZ4';
        case EColumnCodec.ColumnCodecZSTD:
            return 'COMPRESSION_ZSTD';
        case EColumnCodec.ColumnCodecPlain:
            return 'COMPRESSION_NONE';
        default:
            return undefined;
    }
}

function mapEpochUnit(unit: EUnit): TTLSettings['epochMode'] {
    switch (unit) {
        case EUnit.UNIT_SECONDS:
            return 'seconds';
        case EUnit.UNIT_MILLISECONDS:
            return 'milliseconds';
        case EUnit.UNIT_MICROSECONDS:
            return 'microseconds';
        case EUnit.UNIT_NANOSECONDS:
            return 'nanoseconds';
        default:
            return unit;
    }
}

function formatTtlEpochMode(epochMode: string) {
    return epochMode.startsWith('UNIT_')
        ? epochMode.slice('UNIT_'.length)
        : epochMode.toUpperCase();
}

function prepareTTLSettings(enabled?: {
    ColumnName?: string;
    ExpireAfterSeconds?: number;
    ColumnUnit?: EUnit;
}): TTLSettings {
    if (!enabled) {
        return {status: 'disabled'};
    }
    const {ColumnName: column, ExpireAfterSeconds, ColumnUnit} = enabled;
    const isEpochMode = ColumnUnit !== undefined && ColumnUnit !== EUnit.UNIT_AUTO;

    if (isEpochMode) {
        return {
            status: 'enabled',
            column,
            columnWithEpochMode: true,
            lifetime: ExpireAfterSeconds,
            epochMode: mapEpochUnit(ColumnUnit),
        };
    }
    return {
        status: 'enabled',
        column,
        columnWithEpochMode: false,
        lifetime: ExpireAfterSeconds,
        unit: 'seconds',
    };
}

function prepareRowTableSettings(table: TTableDescription): TableSettings {
    const partitioningPolicy = table.PartitionConfig?.PartitioningPolicy;
    const sizeToSplit = partitioningPolicy?.SizeToSplit;
    const autoPartitionBySize = Boolean(sizeToSplit) && sizeToSplit !== '0';

    let partitionsType: PartitionsType = PartitionsType.None;
    if (table.UniformPartitionsCount) {
        partitionsType = PartitionsType.Uniform;
    } else if (table.SplitBoundary && table.SplitBoundary.length > 0) {
        partitionsType = PartitionsType.Explicit;
    }

    const rawFamilies = table.PartitionConfig?.ColumnFamilies ?? [];
    const columnFamilies = rawFamilies.reduce<ColumnFamilyDescription[]>((result, family) => {
        if (!family.Name) {
            return result;
        }

        result.push({
            name: family.Name,
            compression: mapColumnCodec(family.ColumnCodec),
            data: family.StorageConfig?.Data?.PreferredPoolKind
                ? {media: family.StorageConfig.Data.PreferredPoolKind}
                : undefined,
        });

        return result;
    }, []);

    return {
        partitionsType,
        uniformPartitions: table.UniformPartitionsCount,
        autoPartitionBySize,
        autoPartitionBySizeMb:
            autoPartitionBySize && sizeToSplit
                ? Math.round(parseInt(sizeToSplit, 10) / (1024 * 1024))
                : undefined,
        autoPartitionByLoad: partitioningPolicy?.SplitByLoadSettings?.Enabled ?? false,
        autoPartitionMinPartitions: partitioningPolicy?.MinPartitionsCount,
        autoPartitionMaxPartitions: partitioningPolicy?.MaxPartitionsCount,
        keyBloomFilter: table.PartitionConfig?.EnableFilterByKey ?? false,
        ttl: prepareTTLSettings(table.TTLSettings?.Enabled),
        columnFamilies: columnFamilies.length > 0 ? columnFamilies : undefined,
    };
}

function prepareColumnTableSettings(table: TColumnTableDescription): TableSettings {
    return {
        ttl: prepareTTLSettings(table.TtlSettings?.Enabled),
    };
}

export function prepareFormValues(response: TEvDescribeSchemeResult): TableFormValues {
    const pathDesc = response.PathDescription;
    const name = pathDesc?.Self?.Name ?? '';
    const pathType = pathDesc?.Self?.PathType;

    if (pathType === EPathType.EPathTypeColumnTable && pathDesc?.ColumnTableDescription) {
        const desc = pathDesc.ColumnTableDescription;

        return {
            name,
            type: 'column',
            columns: [],
            secondaryIndexes: [],
            deletedColumns: [],
            partitionKey: desc.Sharding?.HashSharding?.Columns ?? [],
            partitionCount: desc.ColumnShardCount ?? 64,
            settings: prepareColumnTableSettings(desc),
        };
    }

    const desc = pathDesc?.Table;

    return {
        name,
        type: 'row',
        columns: [],
        secondaryIndexes: [],
        deletedColumns: [],
        partitionKey: [],
        partitionCount: 0,
        settings: desc ? prepareRowTableSettings(desc) : {ttl: {status: 'disabled'}},
    };
}

export function getTablePathInfoForUpdate(originalTable: TEvDescribeSchemeResult, name: string) {
    const pathDesc = originalTable.PathDescription;
    const originalName = pathDesc?.Self?.Name;
    const tablePath = originalTable.Path ?? originalName ?? name;
    let updatedTablePath = name.startsWith('/') ? name : tablePath;

    if (!name.startsWith('/') && originalName && name !== originalName) {
        updatedTablePath = tablePath.endsWith(originalName)
            ? `${tablePath.slice(0, -originalName.length)}${name}`
            : name;
    }

    return {originalName, tablePath, updatedTablePath};
}

export function getUpdateTableSettings(
    settings: TableSettings | undefined,
    dirtySettings: DirtyTableSettings | undefined,
): Partial<TableSettings> | undefined {
    if (!settings || !dirtySettings) {
        return undefined;
    }

    const shouldUpdateAutoPartitionBySize =
        hasDirtyValue(dirtySettings.autoPartitionBySize) ||
        hasDirtyValue(dirtySettings.autoPartitionBySizeMb);
    const nextSettings: Partial<TableSettings> = {};

    if (shouldUpdateAutoPartitionBySize) {
        nextSettings.autoPartitionBySize = settings.autoPartitionBySize;

        if (
            settings.autoPartitionBySize &&
            typeof settings.autoPartitionBySizeMb === 'number' &&
            !Number.isNaN(settings.autoPartitionBySizeMb)
        ) {
            nextSettings.autoPartitionBySizeMb = settings.autoPartitionBySizeMb;
        }
    }

    if (hasDirtyValue(dirtySettings.autoPartitionByLoad)) {
        nextSettings.autoPartitionByLoad = settings.autoPartitionByLoad;
    }

    if (hasDirtyValue(dirtySettings.autoPartitionMinPartitions)) {
        nextSettings.autoPartitionMinPartitions = settings.autoPartitionMinPartitions;
    }

    if (hasDirtyValue(dirtySettings.autoPartitionMaxPartitions)) {
        nextSettings.autoPartitionMaxPartitions = settings.autoPartitionMaxPartitions;
    }

    if (hasDirtyValue(dirtySettings.keyBloomFilter)) {
        nextSettings.keyBloomFilter = settings.keyBloomFilter;
    }

    if (hasDirtyValue(dirtySettings.ttl)) {
        nextSettings.ttl = settings.ttl;
    }

    return Object.keys(nextSettings).length > 0 ? nextSettings : undefined;
}

export function hasUpdateTableSettings(settings?: Partial<TableSettings>) {
    return buildSettingsCreateItems(settings).length > 0;
}

export function buildCreateTableQuery(options: BuildTemplateOptions) {
    return buildTemplate(CREATE_TABLE_QUERY_TEMPLATE, options);
}

export function buildCreateColumnTableQuery(options: BuildTemplateOptions) {
    return buildTemplate(CREATE_COLUMN_TABLE_QUERY_TEMPLATE, options);
}

export function buildUpdateTableQuery(options: BuildTemplateOptions) {
    return buildTemplate(UPDATE_TABLE_QUERY_TEMPLATE, options);
}

export function prepareYdbCreateQueryColumns(
    columns: ColumnField[],
    tableType: TableFormValues['type'] = 'row',
): Column[] {
    return columns.map((column) => ({
        name: column.name,
        type: column.type,
        key: column.key,
        notNull: column.notNull,
        defaultValue:
            tableType === 'row' && column.withDefaultValue && !column.key && !column.autoincrement
                ? column.defaultValue
                : undefined,
        autoincrement: tableType === 'row' ? column.autoincrement : undefined,
    }));
}
