import type {Column} from '@gravity-ui/react-data-table';

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
        header: 'User',
        render: ({row}) => row.UserSID || '-',
        sortable: false,
    },
    {
        name: 'QueryStartAt',
        header: 'Start time',
        render: ({row}) => formatDateTime(new Date(row.QueryStartAt as string).getTime()),
        sortable: false,
    },
    {
        name: 'Query',
        headerTitle: 'Query text',
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
        header: 'Application',
        render: ({row}) => row.ApplicationName || '-',
        sortable: false,
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

    console.log(data);
    console.log(error);

    return (
        <TableWithControlsLayout.Table loading={isFetching}>
            {error ? (
                <ResponseError error={error?.error} />
            ) : (
                <ResizeableDataTable
                    emptyDataMessage={i18n('no-data')}
                    columnsWidthLSKey={RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY}
                    columns={columns}
                    data={data}
                    settings={QUERY_TABLE_SETTINGS}
                />
            )}
        </TableWithControlsLayout.Table>
    );
};
