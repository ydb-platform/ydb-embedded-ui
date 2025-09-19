import DataTable from '@gravity-ui/react-data-table';
import {Icon} from '@gravity-ui/uikit';

import {getColumnWidth} from '../../../../utils/getColumnWidth';

import i18n from './i18n';
import {b} from './shared';
import type {SchemaColumn, SchemaData} from './types';

import KeyIcon from '@gravity-ui/icons/svgs/key.svg';

export const SCHEMA_COLUMNS_WIDTH_LS_KEY = 'schemaTableColumnsWidth';

const SCHEMA_TABLE_COLUMS_IDS = {
    id: 'id',
    name: 'name',
    keyColumnIndex: 'keyColumnIndex',
    type: 'type',
    notNull: 'notNull',
    autoIncrement: 'autoIncrement',
    defaultValue: 'defaultValue',
    familyName: 'familyName',
    prefferedPoolKind: 'prefferedPoolKind',
    columnCodec: 'columnCodec',
} satisfies Record<string, keyof SchemaData>;

const idColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.id,
    get header() {
        return i18n('column-title.id');
    },
    width: 60,
    align: DataTable.RIGHT,
    render: ({row}) => {
        const keyIcon = <Icon className={b('key-icon')} size={12} data={KeyIcon} />;
        return (
            <span className={b('id-wrapper')}>
                {row.id}
                {row.keyColumnIndex === undefined || row.keyColumnIndex === -1 ? null : keyIcon}
            </span>
        );
    },
};
const nameColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.name,
    get header() {
        return i18n('column-title.name');
    },
    width: 120,
    render: ({row}) => row.name,
};
const typeColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.type,
    get header() {
        return i18n('column-title.type');
    },
    width: 100,
    render: ({row}) => row.type,
};
const notNullColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.notNull,
    get header() {
        return i18n('column-title.notNull');
    },
    width: 100,
    // Table should start with notNull columns on sort click
    defaultOrder: DataTable.DESCENDING,
    render: ({row}) => {
        if (row.notNull) {
            return '\u2713';
        }

        return undefined;
    },
};
const autoIncrementColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.autoIncrement,
    get header() {
        return i18n('column-title.autoIncrement');
    },
    width: 100,
    // Table should start with notNull columns on sort click
    defaultOrder: DataTable.DESCENDING,
    render: ({row}) => {
        if (row.autoIncrement) {
            return '\u2713';
        }

        return undefined;
    },
};
const defaultValueColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.defaultValue,
    get header() {
        return i18n('column-title.defaultValue');
    },
    width: 100,
    render: ({row}) => String(row.defaultValue),
};

const familyColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.familyName,
    get header() {
        return i18n('column-title.family');
    },
    width: 100,
    render: ({row}) => row.familyName,
};
const mediaColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.prefferedPoolKind,
    get header() {
        return i18n('column-title.media');
    },
    width: 100,
    render: ({row}) => row.prefferedPoolKind,
};
const compressionColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.columnCodec,
    get header() {
        return i18n('column-title.compression');
    },
    width: 130,
    render: ({row}) => row.columnCodec,
};

const WIDTH_PREDICTION_ROWS_COUNT = 100;

function normalizeColumns(columns: SchemaColumn[], data?: SchemaData[]) {
    if (!data) {
        return columns;
    }
    const dataSlice = data.slice(0, WIDTH_PREDICTION_ROWS_COUNT);
    return columns.map((column) => {
        return {
            ...column,
            width: getColumnWidth({
                data: dataSlice,
                name: column.name,
                header: typeof column.header === 'string' ? column.header : undefined,
                sortable: column.sortable || column.sortable === undefined,
            }),
        };
    });
}

export function getViewColumns(data?: SchemaData[]): SchemaColumn[] {
    return normalizeColumns([nameColumn, typeColumn], data);
}
export function getSystemViewColumns(data?: SchemaData[]): SchemaColumn[] {
    return normalizeColumns([idColumn, nameColumn, typeColumn, notNullColumn], data);
}
export function getExternalTableColumns(data?: SchemaData[]): SchemaColumn[] {
    return normalizeColumns([idColumn, nameColumn, typeColumn, notNullColumn], data);
}
export function getColumnTableColumns(data?: SchemaData[]): SchemaColumn[] {
    return normalizeColumns([idColumn, nameColumn, typeColumn, notNullColumn], data);
}
export function getRowTableColumns(
    data: SchemaData[] | undefined,
    extended: boolean,
    hasAutoIncrement: boolean,
    hasDefaultValue: boolean,
): SchemaColumn[] {
    const rowTableColumns = [idColumn, nameColumn, typeColumn, notNullColumn];

    if (hasDefaultValue) {
        rowTableColumns.push(defaultValueColumn);
    }

    if (extended) {
        rowTableColumns.push(familyColumn, mediaColumn, compressionColumn);
    }

    if (hasAutoIncrement) {
        rowTableColumns.push(autoIncrementColumn);
    }

    return normalizeColumns(rowTableColumns, data);
}
