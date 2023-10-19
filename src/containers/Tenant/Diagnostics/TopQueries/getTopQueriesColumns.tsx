import cn from 'bem-cn-lite';

import DataTable, {type Column} from '@gravity-ui/react-data-table';

import type {KeyValueRow} from '../../../../types/api/query';
import {formatDateTime, formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {TruncatedQuery} from '../../../../components/TruncatedQuery/TruncatedQuery';
import {TopQueriesTruncatedQuery} from '../../../../components/TruncatedQuery/TopQueriesTruncatedQuery';
import {MAX_QUERY_HEIGHT} from '../../utils/constants';

import './TopQueries.scss';

const b = cn('kv-top-queries');

const TOP_QUERIES_COLUMNS_IDS = {
    CPUTimeUs: 'CPUTimeUs',
    QueryText: 'QueryText',
    EndTime: 'EndTime',
    ReadRows: 'ReadRows',
    ReadBytes: 'ReadBytes',
    UserSID: 'UserSID',
    TopQueriesQueryText: 'TopQueriesQueryText',
};

const cpuTimeUsColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.CPUTimeUs,
    sortAccessor: (row) => Number(row.CPUTimeUs),
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
};

const endTimeColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.EndTime,
    render: ({row}) => formatDateTime(new Date(row.EndTime as string).getTime()),
    align: DataTable.RIGHT,
};

const readRowsColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.ReadRows,
    render: ({row}) => formatNumber(row.ReadRows),
    sortAccessor: (row) => Number(row.ReadRows),
    align: DataTable.RIGHT,
};

const readBytesColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.ReadBytes,
    render: ({row}) => formatNumber(row.ReadBytes),
    sortAccessor: (row) => Number(row.ReadBytes),
    align: DataTable.RIGHT,
};

const userSIDColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.UserSID,
    render: ({row}) => <div className={b('user-sid')}>{row.UserSID || '–'}</div>,
    sortAccessor: (row) => String(row.UserSID),
    align: DataTable.LEFT,
};

const topQueriesQueryTextColumn: Column<KeyValueRow> = {
    name: TOP_QUERIES_COLUMNS_IDS.TopQueriesQueryText,
    render: ({row}) => <TopQueriesTruncatedQuery value={row.QueryText?.toString()} />,
    sortable: false,
};

export const getTopQueriesColumns = (): Column<KeyValueRow>[] => {
    return [
        cpuTimeUsColumn,
        queryTextColumn,
        endTimeColumn,
        readRowsColumn,
        readBytesColumn,
        userSIDColumn,
    ];
};

export const getTenantOverviewTopQueriesColumns = (): Column<KeyValueRow>[] => {
    return [topQueriesQueryTextColumn, cpuTimeUsColumn];
};
