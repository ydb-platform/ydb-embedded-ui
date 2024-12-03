import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../../../types/api/query';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';

import {getTopQueriesColumns} from './columns/columns';
import {TOP_QUERIES_COLUMNS_WIDTH_LS_KEY} from './columns/constants';
import i18n from './i18n';
import {TOP_QUERIES_TABLE_SETTINGS, useTopQueriesSort} from './utils';

interface Props {
    database: string;
    onRowClick: (query: string) => void;
    rowClassName: string;
}

export const TopQueriesData = ({database, onRowClick, rowClassName}: Props) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filters = useTypedSelector((state) => state.executeTopQueries);

    const {tableSort, handleTableSort, backendSort} = useTopQueriesSort();

    const {currentData, isFetching, error} = topQueriesApi.useGetTopQueriesQuery(
        {
            database,
            filters,
            sortOrder: backendSort,
        },
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && currentData === undefined;

    const data = currentData?.resultSets?.[0]?.result || [];

    const columns = getTopQueriesColumns();

    const handleRowClick = (row: KeyValueRow) => {
        return onRowClick(row.QueryText as string);
    };

    return (
        <React.Fragment>
            {error ? <ResponseError error={parseQueryErrorToString(error)} /> : null}
            <TableWithControlsLayout.Table loading={loading}>
                <ResizeableDataTable
                    emptyDataMessage={i18n('no-data')}
                    columnsWidthLSKey={TOP_QUERIES_COLUMNS_WIDTH_LS_KEY}
                    columns={columns}
                    data={data || []}
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
