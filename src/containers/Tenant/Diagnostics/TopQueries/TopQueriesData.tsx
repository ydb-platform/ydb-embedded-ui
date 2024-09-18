import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {EPathType} from '../../../../types/api/schema';
import {isSortableTopQueriesProperty} from '../../../../utils/diagnostics';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';
import {isColumnEntityType} from '../../utils/schema';

import {TOP_QUERIES_COLUMNS, TOP_QUERIES_COLUMNS_WIDTH_LS_KEY} from './getTopQueriesColumns';
import i18n from './i18n';

interface Props {
    database: string;
    onRowClick: (row: any) => void;
    type?: EPathType;
}

export const TopQueriesData = ({database, onRowClick, type}: Props) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filters = useTypedSelector((state) => state.executeTopQueries);
    const {currentData, isFetching, error} = topQueriesApi.useGetTopQueriesQuery(
        {
            database,
            filters,
        },
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && currentData === undefined;
    const {result: data} = currentData || {};

    const rawColumns = TOP_QUERIES_COLUMNS;
    const columns = rawColumns.map((column) => ({
        ...column,
        sortable: isSortableTopQueriesProperty(column.name),
    }));

    if (error && !data) {
        return (
            <TableWithControlsLayout.Table>
                <ResponseError error={error} />
            </TableWithControlsLayout.Table>
        );
    }

    if (!data || isColumnEntityType(type)) {
        return <TableWithControlsLayout.Table>{i18n('no-data')}</TableWithControlsLayout.Table>;
    }

    return (
        <TableWithControlsLayout.Table loading={loading}>
            <ResizeableDataTable
                columnsWidthLSKey={TOP_QUERIES_COLUMNS_WIDTH_LS_KEY}
                columns={columns}
                data={data}
                settings={QUERY_TABLE_SETTINGS}
                onRowClick={onRowClick}
            />
        </TableWithControlsLayout.Table>
    );
};
