import DataTable from '@gravity-ui/react-data-table';
import {Icon} from '@gravity-ui/uikit';

import i18n from './i18n';
import {b} from './shared';
import type {SchemaColumn, SchemaData} from './types';

import keyIcon from '../../../../assets/icons/key.svg';

export const SCHEMA_COLUMNS_WIDTH_LS_KEY = 'schemaTableColumnsWidth';

export const SCHEMA_TABLE_COLUMS_IDS = {
    id: 'id',
    name: 'name',
    isKeyColumn: 'isKeyColumn',
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
    render: ({row}) => row.id,
};
const nameColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.name,
    get header() {
        return i18n('column-title.name');
    },
    width: 100,
    render: ({row}) => row.name,
};
const keyColumn: SchemaColumn = {
    name: SCHEMA_TABLE_COLUMS_IDS.isKeyColumn,
    get header() {
        return i18n('column-title.key');
    },
    width: 70,
    resizeMinWidth: 70,
    // Table should start with key columns on sort click
    defaultOrder: DataTable.ASCENDING,
    sortAccessor: (row) => row.keyAccessor,
    render: ({row}) => {
        return row.isKeyColumn ? (
            <div className={b('key-icon')}>
                <Icon data={keyIcon} width={12} height={7} />
            </div>
        ) : null;
    },
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
    width: 100,
    render: ({row}) => row.columnCodec,
};

export function getViewColumns(): SchemaColumn[] {
    return [nameColumn, typeColumn];
}
export function getExternalTableColumns(): SchemaColumn[] {
    return [idColumn, nameColumn, typeColumn, notNullColumn];
}
export function getColumnTableColumns(): SchemaColumn[] {
    return [idColumn, keyColumn, nameColumn, typeColumn, notNullColumn];
}
export function getRowTableColumns(
    extended: boolean,
    hasAutoIncrement: boolean,
    hasDefaultValue: boolean,
): SchemaColumn[] {
    const rowTableColumns = [idColumn, keyColumn, nameColumn, typeColumn, notNullColumn];

    if (hasDefaultValue) {
        rowTableColumns.push(defaultValueColumn);
    }

    if (extended) {
        rowTableColumns.push(familyColumn, mediaColumn, compressionColumn);
    }

    if (hasAutoIncrement) {
        rowTableColumns.push(autoIncrementColumn);
    }

    return rowTableColumns;
}
