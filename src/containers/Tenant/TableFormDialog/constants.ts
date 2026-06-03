export const TABLE_FORM_DIALOG = 'table-form-dialog';

export const ENTITY_NAME_REG_EXP = /^[a-zA-Z0-9._-]+$/;
export const ENTITY_PATH_REG_EXP = /^[a-zA-Z0-9._-]+(\/[a-zA-Z0-9._-]+)*$/;
export const ENTITY_RENAME_PATH_REG_EXP = /^\/?[a-zA-Z0-9._-]+(\/[a-zA-Z0-9._-]+)*$/;
export const COLUMN_NAME_REG_EXP = /^\w[\w_-]*$/;

export const MIN_PARTITION_SIZE_MB = 20;
export const MAX_PARTITION_SIZE_MB = 5120;

export const MIN_PARTITIONS_COUNT = 1;
export const MAX_PARTITIONS_COUNT = 35000;

export const MIN_COLUMN_PARTITION_COUNT = 1;
export const MAX_COLUMN_PARTITION_COUNT = 1000;

export const SPLIT_POINT_STRING_TYPES = new Set<string>(['String', 'Utf8']);

export const YDB_TABLE_TYPES: string[] = [
    'Bool',
    'Int8',
    'Int16',
    'Int32',
    'Int64',
    'Uint8',
    'Uint16',
    'Uint32',
    'Uint64',
    'Float',
    'Double',
    'Decimal(22,9)',
    'String',
    'Utf8',
    'Json',
    'JsonDocument',
    'Date32',
    'Date',
    'Datetime64',
    'Datetime',
    'Timestamp64',
    'Timestamp',
    'Interval64',
    'Interval',
    'Uuid',
];

export const YDB_COLUMN_TABLE_TYPES: string[] = [
    'Int8',
    'Int16',
    'Int32',
    'Int64',
    'Uint8',
    'Uint16',
    'Uint32',
    'Uint64',
    'Float',
    'Double',
    'String',
    'Utf8',
    'Json',
    'JsonDocument',
    'Date32',
    'Date',
    'Datetime64',
    'Datetime',
    'Timestamp64',
    'Timestamp',
];

export const YDB_PK_TYPES = new Set<string>([
    'Bool',
    'Int8',
    'Int16',
    'Int32',
    'Int64',
    'Uint8',
    'Uint16',
    'Uint32',
    'Uint64',
    'String',
    'Utf8',
    'Date',
    'Date32',
    'Datetime',
    'Datetime64',
    'Timestamp',
    'Timestamp64',
    'Uuid',
    'Interval64',
]);

export const YDB_COLUMN_PK_TYPES = new Set<string>([
    'Int32',
    'Int64',
    'Uint8',
    'Uint16',
    'Uint32',
    'Uint64',
    'String',
    'Utf8',
    'Date',
    'Date32',
    'Datetime',
    'Datetime64',
    'Timestamp',
    'Timestamp64',
]);
