import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../../../types/api/query';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';

import {getRunningQueriesColumns} from './columns/columns';
import {RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY} from './columns/constants';
import i18n from './i18n';
import {TOP_QUERIES_TABLE_SETTINGS, useRunningQueriesSort} from './utils';

interface Props {
    database: string;
    onRowClick: (query: string) => void;
    rowClassName: string;
}

export const RunningQueriesData = ({database, onRowClick, rowClassName}: Props) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filters = useTypedSelector((state) => state.executeTopQueries);

    const {tableSort, handleTableSort, backendSort} = useRunningQueriesSort();

    const {currentData, isFetching, error} = topQueriesApi.useGetRunningQueriesQuery(
        {
            database,
            filters,
            sortOrder: backendSort,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const data = currentData?.resultSets?.[0].result || [];

    const columns = React.useMemo(() => {
        return getRunningQueriesColumns();
    }, []);

    const handleRowClick = (row: KeyValueRow) => {
        return onRowClick(row.QueryText as string);
    };

    return (
        <React.Fragment>
            {error ? <ResponseError error={parseQueryErrorToString(error)} /> : null}
            <TableWithControlsLayout.Table loading={loading}>
                <ResizeableDataTable
                    emptyDataMessage={i18n('no-data')}
                    columnsWidthLSKey={RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY}
                    columns={columns}
                    data={data}
                    settings={TOP_QUERIES_TABLE_SETTINGS}
                    onRowClick={handleRowClick}
                    rowClassName={() => rowClassName}
                    sortOrder={tableSort}
                    onSort={handleTableSort}
                />
            </TableWithControlsLayout.Table>
        </React.Fragment>
    );
};
