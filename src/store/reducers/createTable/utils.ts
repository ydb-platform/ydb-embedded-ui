import {duration} from '@gravity-ui/date-utils';

import {
    CREATE_COLUMN_TABLE_QUERY_TEMPLATE,
    CREATE_TABLE_QUERY_TEMPLATE,
    NAME_REGEX,
    SECONDS_A_DAY,
    SERIAL_TYPES_MAP,
} from './constants';
import {PartitionsType} from './types';
import type {
    BuildTemplateOptions,
    Column,
    ColumnFamilyDescription,
    ColumnField,
    SecondaryIndex,
    TableSettings,
    UpdatedSecondaryIndex,
} from './types';

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

function prepareColumnValue(column: Column, value: string | null) {
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
            const escapedValue = value
                .replaceAll('\\', '\\\\')
                // Escape control characters (\u0000-\u001F and \u007F) as Unicode escape sequences
                // eslint-disable-next-line no-control-regex
                .replace(/[\u0000-\u001F\u007F]/g, (controlCharacters) => {
                    return '\\u' + controlCharacters.charCodeAt(0).toString(16).padStart(4, '0');
                })
                .replace(/"/g, '\\"');

            return `"${escapedValue}"`;
        }
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

const buildParamName = (name: string) => `$p${name}`;

const buildName = (name: string) => `\`${name.replace(/`/g, '\\`')}\``;

const buildType = (column: Column) => {
    if (column.autoincrement) {
        const serialType = SERIAL_TYPES_MAP[column.type];
        return serialType ?? column.type;
    }

    return column.type;
};

const buildNonNull = (column: Column) => (column.notNull ? 'NOT NULL' : '');

const buildDefaultValue = (column: Column) =>
    typeof column.defaultValue !== 'undefined'
        ? `DEFAULT ${prepareColumnValue(column, String(column.defaultValue))}`
        : '';

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

const buildDeclaration = (column: Column) =>
    `DECLARE ${buildParamName(column.name)} AS ${column.type};`;

const buildValues = (columns: Column[], data: {[key: string]: string | null}) => {
    return columns
        .filter((column) => typeof data[column.name] !== 'undefined')
        .map((column) => prepareColumnValue(column, data[column.name]));
};

const buildSettingsCreateItems = (settings?: TableSettings) => {
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

    if (typeof settings.autoPartitionMinPartitions !== 'undefined') {
        items.push(
            `AUTO_PARTITIONING_MIN_PARTITIONS_COUNT = ${settings.autoPartitionMinPartitions}`,
        );
    }

    if (typeof settings.autoPartitionMaxPartitions !== 'undefined') {
        items.push(
            `AUTO_PARTITIONING_MAX_PARTITIONS_COUNT = ${settings.autoPartitionMaxPartitions}`,
        );
    }

    if (
        settings.partitionsType === PartitionsType.Uniform &&
        typeof settings.uniformPartitions !== 'undefined'
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

    if (settings?.ttl?.status === 'enabled' && settings?.ttl?.column) {
        const {column, lifetime = 0, unit = 'seconds', epochMode} = settings.ttl;
        const duration = getDurationWithDaysOnly(lifetime, unit);
        items.push(
            `TTL = Interval("${duration}") ON ${buildName(column)}${
                epochMode ? ` AS ${epochMode.toUpperCase()}` : ''
            }`,
        );
    }

    if (typeof settings.keyBloomFilter !== 'undefined') {
        items.push(`KEY_BLOOM_FILTER = ${settings.keyBloomFilter ? 'ENABLED' : 'DISABLED'}`);
    }

    return items;
};

const buildSettingsUpdateItems = (settings?: TableSettings, pad = ' ') =>
    buildSettingsCreateItems(settings)
        .map((item) => `SET ${item.replace(/ = /g, ' ')}`)
        .join(`,${pad}`);

const buildAddColumns = (columns: Column[] = [], pad = ' ') =>
    columns
        .map(
            ({name, type, notNull}) =>
                `ADD COLUMN ${buildName(name)} ${type}${notNull ? ' NOT NULL' : ''}`,
        )
        .join(`,${pad}`);

const buildDropColumns = (columns: Column[] = [], pad = ' ') =>
    columns.map(({name}) => `DROP COLUMN ${buildName(name)}`).join(`,${pad}`);

const buildAddSecondaryIndexes = (indexes: SecondaryIndex[] = [], pad = ' ') =>
    indexes
        .map(
            ({name, key}) =>
                `ADD INDEX ${buildName(name)} GLOBAL ON (${key.map(buildName).join(',')})`,
        )
        .join(`,${pad}`);

const buildDropSecondaryIndex = ({name}: UpdatedSecondaryIndex) => `DROP INDEX ${buildName(name)}`;

const buildRenameSecondaryIndex = ({name, newName}: UpdatedSecondaryIndex) =>
    `RENAME INDEX ${buildName(name)} TO ${buildName(newName)}`;

const buildUpdatedSecondaryIndexes = (indexes: UpdatedSecondaryIndex[] = [], pad = ' ') =>
    indexes
        .map((index) =>
            index.isDeleted ? buildDropSecondaryIndex(index) : buildRenameSecondaryIndex(index),
        )
        .join(`,${pad}`);

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

const convertCompressionLevel = (columnFamilyDescription: ColumnFamilyDescription) => {
    // @ts-expect-error TODO change property
    return columnFamilyDescription?.data?.level || null;
};

const buildFamilyGroups = (settings?: TableSettings) => {
    const columnFamilies = settings?.columnFamilies || [];
    const isEmpty =
        !columnFamilies?.length ||
        (columnFamilies?.length === 1 && columnFamilies[0]?.compression === 'COMPRESSION_NONE');
    if (isEmpty) {
        return [];
    }

    return columnFamilies.map((columnFamilyDescription) => {
        const settings: Array<string> = [];

        const codec = convertCompressionCodec(columnFamilyDescription);
        if (codec) {
            settings.push(`COMPRESSION = "${codec}"`);
        }

        const storageDeviceType = convertCompressionStorageDeviceType(columnFamilyDescription);
        if (storageDeviceType) {
            settings.push(`DATA = "${storageDeviceType}"`);
        }

        const level = convertCompressionLevel(columnFamilyDescription);
        if (typeof level === 'number') {
            settings.push(`COMPRESSION_LEVEL = ${level}`);
        }

        return `FAMILY ${buildName(columnFamilyDescription.name)} (${settings.join(`, `)})`;
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
    settings?: TableSettings;
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

const buildSelectScheme = (columns: Column[] = [], pad = ' ') => {
    return pad + buildNames(columns).join(`,${pad}`);
};

const buildInsertScheme = (
    columns: Column[] = [],
    values: {[key: string]: string | null} = {},
    pad = ' ',
) => {
    return (
        pad + buildNames(columns.filter((column) => Boolean(values[column.name]))).join(`,${pad}`)
    );
};

const buildKeysScheme = (columns: Column[] = [], pad = ' ') => {
    return pad + buildKeys(columns).join(`,${pad}`);
};

const buildDeclarationsScheme = (columns: Column[] = []) => {
    return columns.map(buildDeclaration).join('\n');
};

const buildValuesScheme = (
    columns: Column[] = [],
    data: {[key: string]: string | null} = {},
    pad = ' ',
) => {
    return pad + buildValues(columns, data).join(`,${pad}`);
};

const buildColumnsHash = (columns: string[] = []) =>
    `HASH(${columns.map((col) => '`' + col.replaceAll('`', '\\`') + '`').join(', ')})`;

function buildTemplate(
    template: string,
    {
        tableName,
        columns,
        values,
        secondaryIndexes,
        deletedColumns,
        updatedSecondaryIndexes,
        columnsHash,
        settings,
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
        .replace(/\s*%columns%/g, (found: string) => {
            const [pad] = /^\s*/.exec(found) || [];
            return buildSelectScheme(columns, pad);
        })
        .replace(/\s*%insertColumns%/g, (found: string) => {
            const [pad] = /^\s*/.exec(found) || [];
            return buildInsertScheme(columns, values, pad);
        })
        .replace(/\s*%declarations%/g, (found: string) => {
            const [pad] = /^\s*/.exec(found) || [];
            return pad + buildDeclarationsScheme(columns);
        })
        .replace(/\s*%values%/g, (found: string) => {
            const [pad] = /^\s*/.exec(found) || [];
            return buildValuesScheme(columns, values, pad);
        })
        .replace(/\s*%keys%/g, (found: string) => {
            const [pad] = /^\s*/.exec(found) || [];
            return buildKeysScheme(columns, pad);
        })
        .replace(/\s*%actions%/g, (found: string) => {
            const [pad = ' '] = /^\s*/.exec(found) || [];

            return (
                pad +
                [
                    buildDropColumns(deletedColumns, pad),
                    buildAddColumns(columns, pad),
                    buildAddSecondaryIndexes(secondaryIndexes, pad),
                    buildUpdatedSecondaryIndexes(updatedSecondaryIndexes, pad),
                    buildSettingsUpdateItems(settings, pad),
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

export function buildCreateTableQuery(options: BuildTemplateOptions) {
    return buildTemplate(CREATE_TABLE_QUERY_TEMPLATE, options);
}

export function buildCreateColumnTableQuery(options: BuildTemplateOptions) {
    return buildTemplate(CREATE_COLUMN_TABLE_QUERY_TEMPLATE, options);
}

export function prepareYdbCreateQueryColumns(columns: ColumnField[]): Column[] {
    return columns.map((column) => ({
        name: column.name,
        type: column.type,
        key: column.key,
        notNull: column.notNull,
        defaultValue: column.withDefaultValue ? column.defaultValue : undefined,
        autoincrement: column.autoincrement,
    }));
}
