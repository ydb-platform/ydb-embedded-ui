import DataTable from '@gravity-ui/react-data-table';
import type {Column, OrderType} from '@gravity-ui/react-data-table';

import {FixedHeightQuery} from '../../../../../components/FixedHeightQuery/FixedHeightQuery';
import type {KeyValueRow} from '../../../../../types/api/query';
import {cn} from '../../../../../utils/cn';
import {formatDateTime, formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import {generateHash} from '../../../../../utils/generateHash';
import {formatToMs, parseUsToMs} from '../../../../../utils/timeParsers';

import {
    QUERIES_COLUMNS_IDS,
    QUERIES_COLUMNS_TITLES,
    isSortableRunningQueriesColumn,
    isSortableTopQueriesColumn,
} from './constants';

import '../TopQueries.scss';

const b = cn('kv-top-queries');

const cpuTimeUsColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.CPUTime,
    header: QUERIES_COLUMNS_TITLES.CPUTime,
    render: ({row}) => formatToMs(parseUsToMs(row.CPUTimeUs ?? undefined)),
    width: 120,
    align: DataTable.RIGHT,
};

const getQueryTextColumn = (lines = 3) => {
    const queryTextColumn: Column<KeyValueRow> = {
        name: QUERIES_COLUMNS_IDS.QueryText,
        header: QUERIES_COLUMNS_TITLES.QueryText,
        render: ({row}) => (
            <div className={b('query')}>
                <FixedHeightQuery
                    value={row.QueryText?.toString()}
                    lines={lines}
                    hasClipboardButton
                />
            </div>
        ),
        width: 500,
    };
    return queryTextColumn;
};

const endTimeColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.EndTime,
    header: QUERIES_COLUMNS_TITLES.EndTime,
    render: ({row}) => formatDateTime(new Date(row.EndTime as string).getTime()),
    align: DataTable.RIGHT,
    width: 200,
};

const readRowsColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.ReadRows,
    header: QUERIES_COLUMNS_TITLES.ReadRows,
    render: ({row}) => formatNumber(row.ReadRows),
    align: DataTable.RIGHT,
    width: 150,
};

const readBytesColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.ReadBytes,
    header: QUERIES_COLUMNS_TITLES.ReadBytes,
    render: ({row}) => formatNumber(row.ReadBytes),
    align: DataTable.RIGHT,
    width: 150,
};

const userSIDColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.UserSID,
    header: QUERIES_COLUMNS_TITLES.UserSID,
    render: ({row}) => <div className={b('user-sid')}>{row.UserSID || '–'}</div>,
    align: DataTable.LEFT,
    width: 120,
};

const queryHashColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.QueryHash,
    header: QUERIES_COLUMNS_TITLES.QueryHash,
    render: ({row}) => <div className={b('query-hash')}>{generateHash(String(row.QueryText))}</div>,
    width: 130,
};

const durationColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.Duration,
    header: QUERIES_COLUMNS_TITLES.Duration,
    render: ({row}) => formatToMs(parseUsToMs(row.Duration ?? undefined)),
    align: DataTable.RIGHT,
    width: 150,
};

const queryStartColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.QueryStartAt,
    header: QUERIES_COLUMNS_TITLES.QueryStartAt,
    render: ({row}) => formatDateTime(new Date(row.QueryStartAt as string).getTime()),
    resizeable: false,
    width: 160,
};

const requestUnitsColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.RequestUnits,
    header: QUERIES_COLUMNS_TITLES.RequestUnits,
    render: ({row}) => formatNumber(row.RequestUnits),
    align: DataTable.RIGHT,
    width: 150,
};

const applicationColumn: Column<KeyValueRow> = {
    name: QUERIES_COLUMNS_IDS.ApplicationName,
    header: QUERIES_COLUMNS_TITLES.ApplicationName,
    render: ({row}) => <div className={b('user-sid')}>{row.ApplicationName || '–'}</div>,
};

export function getTopQueriesColumns() {
    const columns = [
        queryHashColumn,
        cpuTimeUsColumn,
        durationColumn,
        readBytesColumn,
        requestUnitsColumn,
        getQueryTextColumn(),
        endTimeColumn,
        readRowsColumn,
        userSIDColumn,
    ];

    return columns.map((column) => ({
        ...column,
        sortable: isSortableTopQueriesColumn(column.name),
        defaultOrder: DataTable.DESCENDING as OrderType,
    }));
}

export function getTenantOverviewTopQueriesColumns() {
    return [queryHashColumn, getQueryTextColumn(6), cpuTimeUsColumn];
}
export function getRunningQueriesColumns() {
    const columns = [
        queryHashColumn,
        userSIDColumn,
        queryStartColumn,
        getQueryTextColumn(),
        applicationColumn,
    ];

    return columns.map((column) => ({
        ...column,
        sortable: isSortableRunningQueriesColumn(column.name),
    }));
}
