import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';

import {YDBSyntaxHighlighter} from '../../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import {TruncatedQuery} from '../../../../../components/TruncatedQuery/TruncatedQuery';
import type {KeyValueRow} from '../../../../../types/api/query';
import {cn} from '../../../../../utils/cn';
import {formatDateTime, formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import {generateHash} from '../../../../../utils/generateHash';
import {formatToMs, parseUsToMs} from '../../../../../utils/timeParsers';
import {MAX_QUERY_HEIGHT} from '../../../utils/constants';

import {
    TOP_QUERIES_COLUMNS_IDS,
    TOP_QUERIES_COLUMNS_TITLES,
    isSortableTopQueriesColumn,
} from './constants';

import '../TopQueries.scss';

const b = cn('kv-top-queries');

const cpuTimeUsColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.CPUTime,
    header: TOP_QUERIES_COLUMNS_TITLES.CPUTime,
    sortAccessor: (row) => Number(row.CPUTimeUs),
    render: ({row}) => formatToMs(parseUsToMs(row.CPUTimeUs ?? undefined)),
    width: 120,
    align: DataTable.RIGHT,
    sortable: false,
};

const queryTextColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.QueryText,
    header: TOP_QUERIES_COLUMNS_TITLES.QueryText,
    sortAccessor: (row) => Number(row.CPUTimeUs),
    render: ({row}) => (
        <div className={b('query')}>
            <TruncatedQuery
                value={row.QueryText?.toString()}
                maxQueryHeight={MAX_QUERY_HEIGHT}
                hasClipboardButton
            />
        </div>
    ),
    sortable: false,
    width: 500,
};

const endTimeColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.EndTime,
    header: TOP_QUERIES_COLUMNS_TITLES.EndTime,
    render: ({row}) => formatDateTime(new Date(row.EndTime as string).getTime()),
    align: DataTable.RIGHT,
    width: 200,
};

const readRowsColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.ReadRows,
    header: TOP_QUERIES_COLUMNS_TITLES.ReadRows,
    render: ({row}) => formatNumber(row.ReadRows),
    sortAccessor: (row) => Number(row.ReadRows),
    align: DataTable.RIGHT,
    width: 150,
};

const readBytesColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.ReadBytes,
    header: TOP_QUERIES_COLUMNS_TITLES.ReadBytes,
    render: ({row}) => formatNumber(row.ReadBytes),
    sortAccessor: (row) => Number(row.ReadBytes),
    align: DataTable.RIGHT,
    width: 150,
};

const userSIDColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.UserSID,
    header: TOP_QUERIES_COLUMNS_TITLES.UserSID,
    render: ({row}) => <div className={b('user-sid')}>{row.UserSID || '–'}</div>,
    sortAccessor: (row) => String(row.UserSID),
    align: DataTable.LEFT,
};

const oneLineQueryTextColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.OneLineQueryText,
    header: TOP_QUERIES_COLUMNS_TITLES.OneLineQueryText,
    render: ({row}) => (
        <YDBSyntaxHighlighter
            language="yql"
            text={row.QueryText?.toString() || ''}
            withClipboardButton={{
                withLabel: false,
            }}
        />
    ),
    sortable: false,
    width: 500,
};

const queryHashColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.QueryHash,
    header: TOP_QUERIES_COLUMNS_TITLES.QueryHash,
    render: ({row}) => generateHash(String(row.QueryText)),
    width: 130,
    sortable: false,
};

const durationColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.Duration,
    header: TOP_QUERIES_COLUMNS_TITLES.Duration,
    render: ({row}) => formatToMs(parseUsToMs(row.Duration ?? undefined)),
    sortAccessor: (row) => Number(row.Duration),
    align: DataTable.RIGHT,
    width: 150,
};

const queryStartColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.QueryStartAt,
    header: TOP_QUERIES_COLUMNS_TITLES.QueryStartAt,
    render: ({row}) => formatDateTime(new Date(row.QueryStartAt as string).getTime()),
    sortable: true,
    resizeable: false,
    defaultOrder: DataTable.DESCENDING,
};

const applicationColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.ApplicationName,
    header: TOP_QUERIES_COLUMNS_TITLES.ApplicationName,
    render: ({row}) => <div className={b('user-sid')}>{row.ApplicationName || '–'}</div>,
    sortable: true,
};

export function getTopQueriesColumns() {
    const columns = [
        queryHashColumn,
        cpuTimeUsColumn,
        queryTextColumn,
        endTimeColumn,
        durationColumn,
        readRowsColumn,
        readBytesColumn,
        userSIDColumn,
    ];

    return columns.map((column) => ({
        ...column,
        sortable: isSortableTopQueriesColumn(column.name),
    }));
}

export function getTenantOverviewTopQueriesColumns() {
    return [queryHashColumn, oneLineQueryTextColumn, cpuTimeUsColumn];
}

export function getRunningQueriesColumns() {
    const columns = [userSIDColumn, queryStartColumn, queryTextColumn, applicationColumn];

    return columns.map((column) => ({
        ...column,
        sortable: isSortableTopQueriesColumn(column.name),
    }));
}
