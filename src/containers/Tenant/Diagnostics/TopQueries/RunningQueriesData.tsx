import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../../../types/api/query';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';

import {
    RUNNING_QUERIES_COLUMNS,
    RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY,
} from './getTopQueriesColumns';
import i18n from './i18n';

interface Props {
    database: string;
    onRowClick: (query: string) => void;
    rowClassName: string;
}

export const RunningQueriesData = ({database, onRowClick, rowClassName}: Props) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filters = useTypedSelector((state) => state.executeTopQueries);
    const {currentData, isLoading, error} = topQueriesApi.useGetRunningQueriesQuery(
        {
            database,
            filters,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const data = currentData?.resultSets?.[0].result || [];

    const handleRowClick = (row: KeyValueRow) => {
        return onRowClick(row.QueryText as string);
    };

    return (
        <React.Fragment>
            {error ? <ResponseError error={parseQueryErrorToString(error)} /> : null}
            <TableWithControlsLayout.Table loading={isLoading}>
                <ResizeableDataTable
                    emptyDataMessage={i18n('no-data')}
                    columnsWidthLSKey={RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY}
                    columns={RUNNING_QUERIES_COLUMNS}
                    data={data}
                    settings={QUERY_TABLE_SETTINGS}
                    onRowClick={handleRowClick}
                    rowClassName={() => rowClassName}
                />
            </TableWithControlsLayout.Table>
        </React.Fragment>
    );
};
