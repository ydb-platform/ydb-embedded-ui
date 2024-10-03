import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {isSortableTopQueriesProperty} from '../../../../utils/diagnostics';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';

import {TOP_QUERIES_COLUMNS, TOP_QUERIES_COLUMNS_WIDTH_LS_KEY} from './getTopQueriesColumns';
import i18n from './i18n';

const b = cn('kv-top-queries');

interface Props {
    database: string;
    onRowClick: (query: string) => void;
}

export const TopQueriesData = ({database, onRowClick}: Props) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filters = useTypedSelector((state) => state.executeTopQueries);
    const {currentData, isFetching, error} = topQueriesApi.useGetTopQueriesQuery(
        {
            database,
            filters,
        },
        {pollingInterval: autoRefreshInterval},
    );
    const data = currentData?.resultSets?.[0]?.result || [];

    const rawColumns = TOP_QUERIES_COLUMNS;
    const columns = rawColumns.map((column) => ({
        ...column,
        sortable: isSortableTopQueriesProperty(column.name),
    }));

    const handleRowClick = (row: KeyValueRow) => {
        return onRowClick(row.QueryText as string);
    };

    return (
        <React.Fragment>
            {error ? <ResponseError error={parseQueryErrorToString(error)} /> : null}
            <TableWithControlsLayout.Table loading={isFetching && currentData === undefined}>
                <ResizeableDataTable
                    emptyDataMessage={i18n('no-data')}
                    columnsWidthLSKey={TOP_QUERIES_COLUMNS_WIDTH_LS_KEY}
                    columns={columns}
                    data={data || []}
                    settings={QUERY_TABLE_SETTINGS}
                    onRowClick={handleRowClick}
                    rowClassName={() => b('row')}
                />
            </TableWithControlsLayout.Table>
        </React.Fragment>
    );
};
