import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import {TableColumnSetup} from '@gravity-ui/uikit';
import {isEqual} from 'lodash';

import {DrawerWrapper} from '../../../../components/Drawer';
import {DrawerControlType} from '../../../../components/Drawer/Drawer';
import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {parseQueryErrorToString} from '../../../../utils/query';

import {QueryDetailsDrawerContent} from './QueryDetails/QueryDetailsDrawerContent';
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
    // Internal state for selected row
    // null is reserved for not found state
    const [selectedRow, setSelectedRow] = React.useState<KeyValueRow | null | undefined>(undefined);

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

    const isDrawerVisible = selectedRow !== undefined;

    const handleCloseDetails = React.useCallback(() => {
        setSelectedRow(undefined);
    }, [setSelectedRow]);

    const renderDrawerContent = React.useCallback(() => {
        if (!isDrawerVisible) {
            return null;
        }
        return <QueryDetailsDrawerContent row={selectedRow} onClose={handleCloseDetails} />;
    }, [isDrawerVisible, selectedRow, handleCloseDetails]);

    const onRowClick = React.useCallback(
        (
            row: KeyValueRow | null,
            _index?: number,
            event?: React.MouseEvent<HTMLTableRowElement>,
        ) => {
            event?.stopPropagation();
            setSelectedRow(row);
        },
        [setSelectedRow],
    );

    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isDrawerVisible) {
            inputRef.current?.blur();
        }
    }, [isDrawerVisible]);

    const drawerControls = React.useMemo(() => [{type: DrawerControlType.CLOSE} as const], []);

    return (
        <DrawerWrapper
            isDrawerVisible={isDrawerVisible}
            onCloseDrawer={handleCloseDetails}
            renderDrawerContent={renderDrawerContent}
            drawerId="running-query-details"
            storageKey="running-queries-drawer-width"
            detectClickOutside
            isPercentageWidth
            title={i18n('query-details.title')}
            drawerControls={drawerControls}
        >
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    {renderQueryModeControl()}
                    <Search
                        value={filters.text}
                        onChange={handleTextSearchUpdate}
                        placeholder={i18n('filter.text.placeholder')}
                        className={b('search')}
                        inputRef={inputRef}
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
                        onRowClick={onRowClick}
                        rowClassName={(row) => b('row', {active: isEqual(row, selectedRow)})}
                        sortOrder={tableSort}
                        onSort={handleTableSort}
                    />
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </DrawerWrapper>
    );
};
