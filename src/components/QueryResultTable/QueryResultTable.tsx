import {useMemo} from 'react';
import cn from 'bem-cn-lite';

import DataTable from '@yandex-cloud/react-data-table';
import type {Column, DataTableProps, Settings} from '@yandex-cloud/react-data-table';

import type {ColumnType, KeyValueRow} from '../../types/api/query';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {getColumnType, prepareQueryResponse} from '../../utils/query';
import {isNumeric} from '../../utils/utils';

import {Cell} from './Cell';

import i18n from './i18n';
import './QueryResultTable.scss';

const TABLE_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    stripedRows: true,
};

export const b = cn('ydb-query-result-table');

const prepareTypedColumns = (columns: ColumnType[]) => {
    if (!columns.length) {
        return [];
    }

    return columns.map(({name, type}) => {
        const columnType = getColumnType(type);

        const column: Column<KeyValueRow> = {
            name,
            align: columnType === 'number' ? DataTable.RIGHT : DataTable.LEFT,
            sortAccessor: (row) => {
                const value = row[name];
                if (value === undefined || value === null) return null;
                return columnType === 'number' ? BigInt(value) : value;
            },
            render: ({value}) => <Cell value={value as string} />,
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
            sortAccessor: (row) => isNumeric(row[name]) ? Number(row[name]) : row[name],
            render: ({value}) => <Cell value={value as string} />,
        };

        return column;
    });
};

const getRowIndex = (_: unknown, index: number) => index

interface QueryResultTableProps extends Omit<DataTableProps<KeyValueRow>, 'data' | 'columns' | 'theme'> {
    data?: KeyValueRow[];
    columns?: ColumnType[];
}

export const QueryResultTable = (props: QueryResultTableProps) => {
    const {
        columns: rawColumns,
        data: rawData,
        settings: settingsMix,
        ...restProps
    } = props;

    const data = useMemo(() => prepareQueryResponse(rawData), [rawData]);
    const columns = useMemo(() => {
        return rawColumns ?
            prepareTypedColumns(rawColumns) :
            prepareGenericColumns(data);
    }, [data, rawColumns]);
    const settings = useMemo(() => ({
        ...TABLE_SETTINGS,
        ...settingsMix,
    }), [settingsMix]);

    // empty data is expected to be be an empty array
    // undefined data is not rendered at all
    if (!Array.isArray(rawData)) {
        return null;
    }

    if (!columns.length) {
        return (
            <div className={b('message')}>
                {i18n('empty')}
            </div>
        );
    }

    return (
        <DataTable
            theme="yandex-cloud"
            data={data}
            columns={columns}
            settings={settings}
            // prevent accessing row.id in case it is present but is not the PK (i.e. may repeat)
            rowKey={getRowIndex}
            {...restProps}
        />
    );
};
