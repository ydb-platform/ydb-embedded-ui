import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import type {Column, Settings} from '@gravity-ui/react-data-table';

import type {ColumnType, KeyValueRow} from '../../types/api/query';
import {cn} from '../../utils/cn';
import {DEFAULT_TABLE_SETTINGS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
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

const prepareTypedColumns = (columns: ColumnType[], data: KeyValueRow[] | undefined) => {
    if (!columns.length) {
        return [];
    }

    const dataSlice = data?.slice(0, WIDTH_PREDICTION_ROWS_COUNT);

    return columns.map(({name, type}) => {
        const columnType = getColumnType(type);

        const column: Column<KeyValueRow> = {
            name,
            width: getColumnWidth({data: dataSlice, name}),
            align: columnType === 'number' ? DataTable.RIGHT : DataTable.LEFT,
            render: ({row}) => {
                const data = row[name];
                const normalizedData =
                    columnType === 'binary-string' && typeof data === 'string'
                        ? JSON.stringify(data).slice(1, -1)
                        : String(data);
                return <Cell value={normalizedData} />;
            },
        };

        return column;
    });
};

const prepareGenericColumns = (
    data: KeyValueRow[] | undefined,
    sparseRows = false,
    declaredColumnNames: string[] = [],
) => {
    if (!data?.length) {
        return [];
    }

    const dataSlice = data?.slice(0, WIDTH_PREDICTION_ROWS_COUNT);

    const names = sparseRows
        ? [...new Set([...declaredColumnNames, ...data.flatMap(Object.keys)])].sort()
        : Object.keys(data[0]);

    return names.map((name) => {
        const column: Column<KeyValueRow> = {
            name: sparseRows ? `attribute-${name}` : name,
            header: name,
            accessor: name,
            width: getColumnWidth({data: dataSlice, name}),
            align: isNumeric(data[0][name]) ? DataTable.RIGHT : DataTable.LEFT,
            render: ({value}) => {
                if (sparseRows && (value ?? '') === '') {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return <Cell value={String(value)} />;
            },
        };

        return column;
    });
};

const getRowIndex = (_: unknown, index: number) => index;

// Display row number in format 1-10 instead of 0-9
const getVisibleRowIndex = (_: unknown, index: number) => index + 1;

interface QueryResultTableProps
    extends Omit<ResizeableDataTableProps<KeyValueRow>, 'data' | 'columns'> {
    data?: KeyValueRow[];
    columns?: ColumnType[];
    sparseRows?: boolean;
    declaredColumnNames?: string[];
    settings?: Partial<Settings>;
}

export const QueryResultTable = (props: QueryResultTableProps) => {
    const {columns, data, sparseRows, declaredColumnNames, settings: propsSettings} = props;

    const preparedColumns = React.useMemo(() => {
        return columns
            ? prepareTypedColumns(columns, data)
            : prepareGenericColumns(data, sparseRows, declaredColumnNames);
    }, [columns, data, sparseRows, declaredColumnNames]);

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
