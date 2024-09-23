import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {TruncatedQuery} from '../../../../components/TruncatedQuery/TruncatedQuery';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {formatDateTime} from '../../../../utils/dataFormatters/dataFormatters';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {MAX_QUERY_HEIGHT, QUERY_TABLE_SETTINGS} from '../../utils/constants';

import i18n from './i18n';

const b = cn('kv-top-queries');

interface Props {
    database: string;
}

const RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY = 'runningQueriesColumnsWidth';

const columns: Column<KeyValueRow>[] = [
    {
        name: 'UserSID',
        header: i18n('col_user'),
        render: ({row}) => <div className={b('user-sid')}>{row.UserSID || '–'}</div>,
        sortable: true,
    },
    {
        name: 'QueryStartAt',
        header: i18n('col_start-time'),
        render: ({row}) => formatDateTime(new Date(row.QueryStartAt as string).getTime()),
        sortable: true,
        resizeable: false,
        defaultOrder: DataTable.DESCENDING,
    },
    {
        name: 'Query',
        header: i18n('col_query-text'),
        render: ({row}) => (
            <div className={b('query')}>
                <TruncatedQuery value={row.Query?.toString()} maxQueryHeight={MAX_QUERY_HEIGHT} />
            </div>
        ),
        width: 500,
        sortable: false,
    },
    {
        name: 'ApplicationName',
        header: i18n('col_app'),
        render: ({row}) => <div className={b('user-sid')}>{row.ApplicationName || '–'}</div>,
        sortable: true,
    },
];

export const RunningQueriesData = ({database}: Props) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filters = useTypedSelector((state) => state.executeTopQueries);
    const {
        currentData: data,
        isFetching,
        error,
    } = topQueriesApi.useGetRunningQueriesQuery(
        {
            database,
            filters,
        },
        {pollingInterval: autoRefreshInterval},
    );

    return (
        <TableWithControlsLayout.Table loading={isFetching && data === undefined}>
            {error ? (
                <ResponseError error={error} />
            ) : (
                <ResizeableDataTable
                    emptyDataMessage={i18n('no-data')}
                    columnsWidthLSKey={RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY}
                    columns={columns}
                    data={data || []}
                    settings={QUERY_TABLE_SETTINGS}
                />
            )}
        </TableWithControlsLayout.Table>
    );
};
