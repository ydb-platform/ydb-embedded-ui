import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import type {Column, Settings} from '@gravity-ui/react-data-table';
import {ClipboardButton} from '@gravity-ui/uikit';

import {buildTsvBlobParts} from '../../containers/Tenant/Query/utils/getPreparedResult';
import type {ColumnType, KeyValueRow} from '../../types/api/query';
import {cn} from '../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {getColumnWidth} from '../../utils/getColumnWidth';
import {getColumnType} from '../../utils/query';
import {isNumeric} from '../../utils/utils';
import type {ResizeableDataTableProps} from '../ResizeableDataTable/ResizeableDataTable';
import {ResizeableDataTable} from '../ResizeableDataTable/ResizeableDataTable';

import {Cell} from './Cell';
import i18n from './i18n';

import './QueryResultTable.scss';

const TABLE_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    stripedRows: true,
    sortable: false,
    displayIndices: true,
};

export const b = cn('ydb-query-result-table');

const WIDTH_PREDICTION_ROWS_COUNT = 100;

//used buildTsvBlobParts to convert row to tsv format for copying, so that copied value is the same as when user exports data to tsv
const rowToTsv = (row: KeyValueRow) => buildTsvBlobParts([row]).join('');

const copyColumn: Column<KeyValueRow> = {
    name: '__copy_action__',
    header: '',
    width: 40,
    render: ({row}) => (
        <ClipboardButton
            text={rowToTsv(row)}
            view="flat-secondary"
            size="s"
            title={i18n('action.copy-row')}
        />
    ),
};
const prepareTypedColumns = (columns: ColumnType[], data: KeyValueRow[] | undefined) => {
    if (!columns.length) {
        return [];
    }

    const dataSlice = data?.slice(0, WIDTH_PREDICTION_ROWS_COUNT);

    const dataColumns = columns.map(({name, type}) => {
        const columnType = getColumnType(type);

        const column: Column<KeyValueRow> = {
            name,
            width: getColumnWidth({data: dataSlice, name}),
            align: columnType === 'number' ? DataTable.RIGHT : DataTable.LEFT,
            render: ({row}) => {
                const rowData = row[name];
                const normalizedData =
                    columnType === 'binary-string' && typeof rowData === 'string'
                        ? JSON.stringify(rowData).slice(1, -1)
                        : String(rowData);
                return <Cell value={normalizedData} />;
            },
        };

        return column;
    });

    return dataColumns;
};

const prepareGenericColumns = (data: KeyValueRow[] | undefined) => {
    if (!data?.length) {
        return [];
    }

    const dataSlice = data?.slice(0, WIDTH_PREDICTION_ROWS_COUNT);

    const dataColumns = Object.keys(data[0]).map((name) => {
        const column: Column<KeyValueRow> = {
            name,
            width: getColumnWidth({data: dataSlice, name}),
            align: isNumeric(data[0][name]) ? DataTable.RIGHT : DataTable.LEFT,
            render: ({row}) => <Cell value={String(row[name])} />,
        };

        return column;
    });
    return dataColumns;
};

const getRowIndex = (_: unknown, index: number) => index;

// Display row number in format 1-10 instead of 0-9
const getVisibleRowIndex = (_: unknown, index: number) => index + 1;

interface QueryResultTableProps
    extends Omit<ResizeableDataTableProps<KeyValueRow>, 'data' | 'columns'> {
    data?: KeyValueRow[];
    columns?: ColumnType[];
    settings?: Partial<Settings>;
}

export const QueryResultTable = (props: QueryResultTableProps) => {
    const {columns, data, settings: propsSettings} = props;

    const preparedColumns = React.useMemo(() => {
        const dataColumns = columns
            ? prepareTypedColumns(columns, data)
            : prepareGenericColumns(data);

        const existingNames = new Set(dataColumns.map((col) => col.name));
        let copyColumnName = 'copy';
        while (existingNames.has(copyColumnName)) {
            copyColumnName = `_${copyColumnName}_`;
        }

        return [...dataColumns, {...copyColumn, name: copyColumnName}];
    }, [columns, data]);

    const settings = React.useMemo(() => {
        return {
            ...TABLE_SETTINGS,
            ...propsSettings,
        };
    }, [propsSettings]);

    // empty data is expected to be be an empty array
    // undefined data is not rendered at all
    if (!Array.isArray(data)) {
        return null;
    }

    if (!preparedColumns.length) {
        return <div className={b('message')}>{i18n('empty')}</div>;
    }

    return (
        <ResizeableDataTable
            data={data}
            columns={preparedColumns}
            settings={settings}
            // prevent accessing row.id in case it is present but is not the PK (i.e. may repeat)
            rowKey={getRowIndex}
            visibleRowIndex={getVisibleRowIndex}
            wrapperClassName={b('table-wrapper')}
        />
    );
};
