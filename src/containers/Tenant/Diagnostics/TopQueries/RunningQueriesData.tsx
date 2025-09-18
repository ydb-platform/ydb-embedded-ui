import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Search} from '../../../../components/Search';
import {TableColumnSetup} from '../../../../components/TableColumnSetup/TableColumnSetup';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {parseQueryErrorToString} from '../../../../utils/query';

import {QueriesTableWithDrawer} from './QueriesTableWithDrawer';
import {getRunningQueriesColumns} from './columns/columns';
import {
    DEFAULT_RUNNING_QUERIES_COLUMNS,
    QUERIES_COLUMNS_TITLES,
    REQUIRED_RUNNING_QUERIES_COLUMNS,
    RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY,
    RUNNING_QUERIES_SELECTED_COLUMNS_LS_KEY,
} from './columns/constants';
import {useRunningQueriesSort} from './hooks/useRunningQueriesSort';
import i18n from './i18n';
import {TOP_QUERIES_TABLE_SETTINGS} from './utils';

const b = cn('kv-top-queries');

interface RunningQueriesDataProps {
    database: string;
    renderQueryModeControl: () => React.ReactNode;
    handleTextSearchUpdate: (text: string) => void;
}

export const RunningQueriesData = ({
    database,
    renderQueryModeControl,
    handleTextSearchUpdate,
}: RunningQueriesDataProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filters = useTypedSelector((state) => state.executeTopQueries);

    // Get columns for running queries
    const columns: Column<KeyValueRow>[] = React.useMemo(() => {
        return getRunningQueriesColumns();
    }, []);

    // Use selected columns hook
    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        RUNNING_QUERIES_SELECTED_COLUMNS_LS_KEY,
        QUERIES_COLUMNS_TITLES,
        DEFAULT_RUNNING_QUERIES_COLUMNS,
        REQUIRED_RUNNING_QUERIES_COLUMNS,
    );

    const {tableSort, handleTableSort, backendSort} = useRunningQueriesSort();

    const {currentData, isFetching, isLoading, error} = topQueriesApi.useGetRunningQueriesQuery(
        {
            database,
            filters,
            sortOrder: backendSort,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const rows = currentData?.resultSets?.[0]?.result;

    const inputRef = React.useRef<HTMLInputElement>(null);

    const renderExtraControls = () => {
        return (
            <TableColumnSetup
                popupWidth={200}
                items={columnsToSelect}
                showStatus
                onUpdate={setColumns}
                sortable={false}
            />
        );
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls renderExtraControls={renderExtraControls}>
                {renderQueryModeControl()}
                <Search
                    value={filters.text}
                    onChange={handleTextSearchUpdate}
                    placeholder={i18n('filter.text.placeholder')}
                    className={b('search')}
                    inputRef={inputRef}
                />
            </TableWithControlsLayout.Controls>

            {error ? <ResponseError error={parseQueryErrorToString(error)} /> : null}
            <TableWithControlsLayout.Table loading={isLoading}>
                <QueriesTableWithDrawer
                    columns={columnsToShow}
                    data={rows || []}
                    loading={isFetching && currentData === undefined}
                    columnsWidthLSKey={RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY}
                    emptyDataMessage={i18n('no-data')}
                    sortOrder={tableSort}
                    onSort={handleTableSort}
                    drawerId="running-query-details"
                    storageKey="running-queries-drawer-width"
                    tableSettings={TOP_QUERIES_TABLE_SETTINGS}
                />
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
