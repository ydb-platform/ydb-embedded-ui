import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import type {Column, Settings} from '@gravity-ui/react-data-table';

import type {ColumnType, KeyValueRow} from '../../types/api/query';
import {cn} from '../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {getColumnType, prepareQueryResponse} from '../../utils/query';
import {isNumeric} from '../../utils/utils';
import type {ResizeableDataTableProps} from '../ResizeableDataTable/ResizeableDataTable';
import {ResizeableDataTable} from '../ResizeableDataTable/ResizeableDataTable';

import {Cell} from './Cell';
import i18n from './i18n';
import {getColumnWidth} from './utils/getColumnWidth';

import './QueryResultTable.scss';

const TABLE_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    stripedRows: true,
    dynamicRenderType: 'variable',
    dynamicItemSizeGetter: () => 40,
};

export const b = cn('ydb-query-result-table');

const WIDTH_PREDICTION_ROWS_COUNT = 100;

const prepareTypedColumns = (columns: ColumnType[], data?: KeyValueRow[]) => {
    if (!columns.length) {
        return [];
    }

    const dataSlice = data?.slice(0, WIDTH_PREDICTION_ROWS_COUNT);

    return columns.map(({name, type}) => {
        const columnType = getColumnType(type);

        const column: Column<KeyValueRow> = {
            name,
            width: getColumnWidth({data: dataSlice, name, columnType}),
            align: columnType === 'number' ? DataTable.RIGHT : DataTable.LEFT,
            sortAccessor: (row) => {
                const value = row[name];

                if (value === undefined || value === null) {
                    return null;
                }

                return columnType === 'number' ? BigInt(value) : value;
            },
            render: ({row}) => <Cell value={String(row[name])} />,
        };

        return column;
    });
};

const prepareGenericColumns = (data: KeyValueRow[]) => {
    if (!data.length) {
        return [];
    }

    return Object.keys(data[0]).map((name) => {
        const column: Column<KeyValueRow> = {
            name,
            align: isNumeric(data[0][name]) ? DataTable.RIGHT : DataTable.LEFT,
            sortAccessor: (row) => (isNumeric(row[name]) ? Number(row[name]) : row[name]),
            render: ({row}) => <Cell value={String(row[name])} />,
        };

        return column;
    });
};

const getRowIndex = (_: unknown, index: number) => index;

interface QueryResultTableProps
    extends Omit<ResizeableDataTableProps<KeyValueRow>, 'data' | 'columns'> {
    data?: KeyValueRow[];
    columns?: ColumnType[];
}

export const QueryResultTable = (props: QueryResultTableProps) => {
    const {columns: rawColumns, data: rawData, settings: settingsMix, ...restProps} = props;

    const data = React.useMemo(() => prepareQueryResponse(rawData), [rawData]);
    const columns = React.useMemo(() => {
        return rawColumns ? prepareTypedColumns(rawColumns, data) : prepareGenericColumns(data);
    }, [data, rawColumns]);
    const settings = React.useMemo(
        () => ({
            ...TABLE_SETTINGS,
            ...settingsMix,
        }),
        [settingsMix],
    );

    // empty data is expected to be be an empty array
    // undefined data is not rendered at all
    if (!Array.isArray(rawData)) {
        return null;
    }

    if (!columns.length) {
        return <div className={b('message')}>{i18n('empty')}</div>;
    }

    return (
        <ResizeableDataTable
            data={data}
            columns={columns}
            settings={settings}
            // prevent accessing row.id in case it is present but is not the PK (i.e. may repeat)
            rowKey={getRowIndex}
            {...restProps}
        />
    );
};
