import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';

import {
    OneLineQueryWithPopover,
    TruncatedQuery,
} from '../../../../components/TruncatedQuery/TruncatedQuery';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {formatDateTime, formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {TOP_QUERIES_COLUMNS_IDS} from '../../../../utils/diagnostics';
import {generateHash} from '../../../../utils/generateHash';
import {formatToMs, parseUsToMs} from '../../../../utils/timeParsers';
import {MAX_QUERY_HEIGHT} from '../../utils/constants';

import './TopQueries.scss';

const b = cn('kv-top-queries');

export const TOP_QUERIES_COLUMNS_WIDTH_LS_KEY = 'topQueriesColumnsWidth';

const cpuTimeUsColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.CPUTimeUs,
    sortAccessor: (row) => Number(row.CPUTimeUs),
    render: ({row}) => formatToMs(parseUsToMs(row.CPUTimeUs ?? undefined)),
    width: 120,
    align: DataTable.RIGHT,
    sortable: false,
};

const queryTextColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.QueryText,
    sortAccessor: (row) => Number(row.CPUTimeUs),
    render: ({row}) => (
        <div className={b('query')}>
            <TruncatedQuery value={row.QueryText?.toString()} maxQueryHeight={MAX_QUERY_HEIGHT} />
        </div>
    ),
    sortable: false,
    width: 500,
};

const endTimeColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.EndTime,
    render: ({row}) => formatDateTime(new Date(row.EndTime as string).getTime()),
    align: DataTable.RIGHT,
    width: 200,
};

const readRowsColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.ReadRows,
    render: ({row}) => formatNumber(row.ReadRows),
    sortAccessor: (row) => Number(row.ReadRows),
    align: DataTable.RIGHT,
    width: 150,
};

const readBytesColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.ReadBytes,
    render: ({row}) => formatNumber(row.ReadBytes),
    sortAccessor: (row) => Number(row.ReadBytes),
    align: DataTable.RIGHT,
    width: 150,
};

const userSIDColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.UserSID,
    render: ({row}) => <div className={b('user-sid')}>{row.UserSID || '–'}</div>,
    sortAccessor: (row) => String(row.UserSID),
    align: DataTable.LEFT,
};

const oneLineQueryTextColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.OneLineQueryText,
    header: 'QueryText',
    render: ({row}) => <OneLineQueryWithPopover value={row.QueryText?.toString()} />,
    sortable: false,
    width: 500,
};

const queryHashColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.QueryHash,
    render: ({row}) => generateHash(String(row.QueryText)),
    width: 130,
    sortable: false,
};

const durationColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.Duration,
    header: 'Duration',
    render: ({row}) => formatToMs(parseUsToMs(row.Duration ?? undefined)),
    sortAccessor: (row) => Number(row.Duration),
    align: DataTable.RIGHT,
    width: 150,
};

export const getTopQueriesColumns = (): Column<KeyValueRow>[] => {
    return [
        cpuTimeUsColumn,
        queryTextColumn,
        endTimeColumn,
        durationColumn,
        readRowsColumn,
        readBytesColumn,
        userSIDColumn,
    ];
};

export const getTenantOverviewTopQueriesColumns = (): Column<KeyValueRow>[] => {
    return [queryHashColumn, oneLineQueryTextColumn, cpuTimeUsColumn];
};
