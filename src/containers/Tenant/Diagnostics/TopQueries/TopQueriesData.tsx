import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import {Select, TableColumnSetup} from '@gravity-ui/uikit';
import {isEqual} from 'lodash';

import type {DateRangeValues} from '../../../../components/DateRange';
import {DateRange} from '../../../../components/DateRange';
import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {TimeFrame} from '../../../../store/reducers/executeTopQueries/types';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {parseQueryErrorToString} from '../../../../utils/query';
import {Drawer} from '../../../Drawer/Drawer';

import {QueryDetailsDrawerContent} from './QueryDetails/QueryDetailsDrawerContent';
import {getTopQueriesColumns} from './columns/columns';
import {
    DEFAULT_TOP_QUERIES_COLUMNS,
    QUERIES_COLUMNS_TITLES,
    REQUIRED_TOP_QUERIES_COLUMNS,
    TOP_QUERIES_COLUMNS_WIDTH_LS_KEY,
    TOP_QUERIES_SELECTED_COLUMNS_LS_KEY,
} from './columns/constants';
import {DEFAULT_TIME_FILTER_VALUE, TIME_FRAME_OPTIONS} from './constants';
import {useGetSelectedRowTableSort} from './hooks/useGetSelectedRowTableSort';
import {useSetSelectedTopQueryRowFromParams} from './hooks/useSetSelectedTopQueryRowFromParams';
import i18n from './i18n';
import {TOP_QUERIES_TABLE_SETTINGS, useTopQueriesSort} from './utils';
import {generateShareableUrl} from './utils/generateShareableUrl';

const b = cn('kv-top-queries');

interface TopQueriesDataProps {
    tenantName: string;
    timeFrame: TimeFrame;
    renderQueryModeControl: () => React.ReactNode;
    handleTimeFrameChange: (value: string[]) => void;
    handleDateRangeChange: (value: DateRangeValues) => void;
    handleTextSearchUpdate: (text: string) => void;
}

export const TopQueriesData = ({
    tenantName,
    timeFrame,
    renderQueryModeControl,
    handleTimeFrameChange,
    handleDateRangeChange,
    handleTextSearchUpdate,
}: TopQueriesDataProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filters = useTypedSelector((state) => state.executeTopQueries);
    // Internal state for selected row
    // null is reserved for not found state
    const [selectedRow, setSelectedRow] = React.useState<KeyValueRow | null | undefined>(undefined);

    // Get columns for top queries
    const columns: Column<KeyValueRow>[] = React.useMemo(() => {
        return getTopQueriesColumns();
    }, []);

    // Use selected columns hook
    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        TOP_QUERIES_SELECTED_COLUMNS_LS_KEY,
        QUERIES_COLUMNS_TITLES,
        DEFAULT_TOP_QUERIES_COLUMNS,
        REQUIRED_TOP_QUERIES_COLUMNS,
    );

    const initialTableSort = useGetSelectedRowTableSort();
    const {tableSort, handleTableSort, backendSort} = useTopQueriesSort(initialTableSort);
    const {currentData, isFetching, isLoading, error} = topQueriesApi.useGetTopQueriesQuery(
        {
            database: tenantName,
            filters,
            sortOrder: backendSort,
            timeFrame,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const rows = currentData?.resultSets?.[0]?.result;
    useSetSelectedTopQueryRowFromParams(setSelectedRow, rows);

    const handleCloseDetails = React.useCallback(() => {
        setSelectedRow(undefined);
    }, [setSelectedRow]);

    const isDrawerVisible = selectedRow !== undefined;

    const getTopQueryUrl = React.useCallback(() => {
        if (selectedRow) {
            return generateShareableUrl(selectedRow, tableSort);
        }
        return '';
    }, [selectedRow, tableSort]);

    const renderDrawerContent = React.useCallback(() => {
        if (!isDrawerVisible) {
            return null;
        }
        return (
            <QueryDetailsDrawerContent
                row={selectedRow}
                onClose={handleCloseDetails}
                getTopQueryUrl={getTopQueryUrl}
            />
        );
    }, [isDrawerVisible, selectedRow, handleCloseDetails, getTopQueryUrl]);

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

    return (
        <Drawer.Wrapper
            isDrawerVisible={isDrawerVisible}
            onCloseDrawer={handleCloseDetails}
            renderDrawerContent={renderDrawerContent}
            drawerId="query-details"
            storageKey="kv-top-queries-drawer-width"
            defaultWidth={600}
            detectClickOutside
        >
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    {renderQueryModeControl()}
                    <Select
                        options={TIME_FRAME_OPTIONS}
                        value={[timeFrame]}
                        onUpdate={handleTimeFrameChange}
                    />
                    <DateRange
                        from={filters.from}
                        to={filters.to}
                        onChange={handleDateRangeChange}
                        defaultValue={DEFAULT_TIME_FILTER_VALUE}
                    />
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
                        columnsWidthLSKey={TOP_QUERIES_COLUMNS_WIDTH_LS_KEY}
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
        </Drawer.Wrapper>
    );
};
