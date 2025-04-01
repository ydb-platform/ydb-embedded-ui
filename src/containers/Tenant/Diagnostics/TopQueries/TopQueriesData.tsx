import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {TimeFrame} from '../../../../store/reducers/executeTopQueries/types';
import type {KeyValueRow} from '../../../../types/api/query';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';

import {TOP_QUERIES_COLUMNS_WIDTH_LS_KEY} from './columns/constants';
import i18n from './i18n';
import {TOP_QUERIES_TABLE_SETTINGS, useTopQueriesSort} from './utils';

interface Props {
    database: string;
    timeFrame: TimeFrame;
    onRowClick: (query: string) => void;
    rowClassName: string;
    columns: Column<KeyValueRow>[];
}
export const TopQueriesData = ({database, onRowClick, rowClassName, timeFrame, columns}: Props) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filters = useTypedSelector((state) => state.executeTopQueries);

    const {tableSort, handleTableSort, backendSort} = useTopQueriesSort();

    const {currentData, data, isFetching, isLoading, error} = topQueriesApi.useGetTopQueriesQuery(
        {
            database,
            filters,
            sortOrder: backendSort,
            timeFrame,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const handleRowClick = (row: KeyValueRow) => {
        return onRowClick(row.QueryText as string);
    };

    return (
        <React.Fragment>
            {error ? <ResponseError error={parseQueryErrorToString(error)} /> : null}
            <TableWithControlsLayout.Table loading={isLoading}>
                <ResizeableDataTable
                    emptyDataMessage={i18n('no-data')}
                    columnsWidthLSKey={TOP_QUERIES_COLUMNS_WIDTH_LS_KEY}
                    columns={columns}
                    data={data?.resultSets?.[0].result || []}
                    loading={isFetching && currentData === undefined}
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
