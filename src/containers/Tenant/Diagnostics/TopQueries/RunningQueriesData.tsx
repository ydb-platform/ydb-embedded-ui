import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import {TableColumnSetup} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {DrawerWrapper} from '../../../../containers/DrawerWrapper';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {parseQueryErrorToString} from '../../../../utils/query';

import {QueryDetailsDrawerContent} from './QueryDetailsDrawerContent';
import {getRunningQueriesColumns} from './columns/columns';
import {
    DEFAULT_RUNNING_QUERIES_COLUMNS,
    QUERIES_COLUMNS_TITLES,
    REQUIRED_RUNNING_QUERIES_COLUMNS,
    RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY,
    RUNNING_QUERIES_SELECTED_COLUMNS_LS_KEY,
} from './columns/constants';
import {useRunningQueriesRowSelection} from './hooks/useRunningQueriesRowSelection';
import i18n from './i18n';
import {TOP_QUERIES_TABLE_SETTINGS, useRunningQueriesSort} from './utils';

const b = cn('kv-top-queries');

interface RunningQueriesDataProps {
    tenantName: string;
    renderQueryModeControl: () => React.ReactNode;
    handleTextSearchUpdate: (text: string) => void;
}

export const RunningQueriesData = ({
    tenantName,
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

    const {currentData, data, isFetching, isLoading, error} =
        topQueriesApi.useGetRunningQueriesQuery(
            {
                database: tenantName,
                filters,
                sortOrder: backendSort,
            },
            {pollingInterval: autoRefreshInterval},
        );

    const rows = data?.resultSets?.[0]?.result;
    const {handleRowSelect, selectedRow, hasSearchParams} = useRunningQueriesRowSelection(rows);

    const handleRowClick = (row: KeyValueRow) => {
        // Simply pass the row to handleRowSelect
        handleRowSelect(row);
    };

    const handleCloseDetails = React.useCallback(() => {
        handleRowSelect(null);
    }, [handleRowSelect]);

    const renderDrawerContent = React.useCallback(() => {
        if (!hasSearchParams) {
            return null;
        }
        return <QueryDetailsDrawerContent row={selectedRow} onClose={handleCloseDetails} />;
    }, [hasSearchParams, selectedRow, handleCloseDetails]);

    return (
        <DrawerWrapper
            isDrawerVisible={hasSearchParams && !isFetching}
            onCloseDrawer={handleCloseDetails}
            renderDrawerContent={renderDrawerContent}
            drawerId="running-query-details"
            storageKey="running-queries-drawer-width"
            defaultWidth={600}
            detectClickOutside
            className={b('drawer-container')}
        >
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    {renderQueryModeControl()}
                    <Search
                        value={filters.text}
                        onChange={handleTextSearchUpdate}
                        placeholder={i18n('filter.text.placeholder')}
                        className={b('search')}
                    />
                    <TableColumnSetup
                        popupWidth={200}
                        items={columnsToSelect}
                        showStatus
                        onUpdate={setColumns}
                        sortable={false}
                    />
                </TableWithControlsLayout.Controls>

                {error ? <ResponseError error={parseQueryErrorToString(error)} /> : null}
                <TableWithControlsLayout.Table loading={isLoading}>
                    <ResizeableDataTable
                        emptyDataMessage={i18n('no-data')}
                        columnsWidthLSKey={RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY}
                        columns={columnsToShow}
                        data={rows || []}
                        loading={isFetching && currentData === undefined}
                        settings={TOP_QUERIES_TABLE_SETTINGS}
                        onRowClick={handleRowClick}
                        rowClassName={(row) => b('row', {active: row === selectedRow})}
                        sortOrder={tableSort}
                        onSort={handleTableSort}
                    />
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </DrawerWrapper>
    );
};
