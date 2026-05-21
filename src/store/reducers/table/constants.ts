export const SECONDS_A_DAY = 24 * 60 * 60;

export const NAME_REGEX = /^[a-z_][a-z0-9_]*$/i;

export const SERIAL_TYPES_MAP: Record<string, string> = {
    Int16: 'SmallSerial',
    Int32: 'Serial',
    Int64: 'BigSerial',
};

export const CREATE_TABLE_QUERY_TEMPLATE = `
--!syntax_v1

CREATE TABLE %tableName%
(
    %schema%
)
WITH (
    %settings%
);
`.trim();

export const CREATE_COLUMN_TABLE_QUERY_TEMPLATE = `
--!syntax_v1

CREATE TABLE %tableName%
(
    %schema%
)
PARTITION BY %columnsHash%
WITH (
    STORE = COLUMN,
    %settings%
);
`.trim();

export const UPDATE_TABLE_QUERY_TEMPLATE = `
ALTER TABLE %tableName%
%actions%
`.trim();
