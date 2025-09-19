import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import {Select} from '@gravity-ui/uikit';

import type {DateRangeValues} from '../../../../components/DateRange';
import {DateRange} from '../../../../components/DateRange';
import type {DrawerControl} from '../../../../components/Drawer/Drawer';
import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Search} from '../../../../components/Search';
import {TableColumnSetup} from '../../../../components/TableColumnSetup/TableColumnSetup';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {topQueriesApi} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {TimeFrame} from '../../../../store/reducers/executeTopQueries/types';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {parseQueryErrorToString} from '../../../../utils/query';

import {QueriesTableWithDrawer} from './QueriesTableWithDrawer';
import {getTopQueriesColumns} from './columns/columns';
import {
    DEFAULT_TOP_QUERIES_COLUMNS,
    QUERIES_COLUMNS_TITLES,
    REQUIRED_TOP_QUERIES_COLUMNS,
    TOP_QUERIES_COLUMNS_WIDTH_LS_KEY,
    TOP_QUERIES_SELECTED_COLUMNS_LS_KEY,
} from './columns/constants';
import {DEFAULT_TIME_FILTER_VALUE, TIME_FRAME_OPTIONS} from './constants';
import type {ReactList} from './hooks/useScrollToSelected';
import {useScrollToSelected} from './hooks/useScrollToSelected';
import {useSetSelectedTopQueryRowFromParams} from './hooks/useSetSelectedTopQueryRowFromParams';
import {useTopQueriesSort} from './hooks/useTopQueriesSort';
import i18n from './i18n';
import {TOP_QUERIES_TABLE_SETTINGS} from './utils';
import {generateShareableUrl} from './utils/generateShareableUrl';

const b = cn('kv-top-queries');

interface TopQueriesDataProps {
    database: string;
    timeFrame: TimeFrame;
    renderQueryModeControl: () => React.ReactNode;
    handleTimeFrameChange: (value: string[]) => void;
    handleDateRangeChange: (value: DateRangeValues) => void;
    handleTextSearchUpdate: (text: string) => void;
}

export const TopQueriesData = ({
    database,
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

    // Ref for react-list component to enable scrolling to selected row
    const reactListRef = React.useRef<ReactList>(null);

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

    const {tableSort, handleTableSort, backendSort} = useTopQueriesSort();
    const {currentData, isFetching, isLoading, error} = topQueriesApi.useGetTopQueriesQuery(
        {
            database,
            filters,
            sortOrder: backendSort,
            timeFrame,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const rows = currentData?.resultSets?.[0]?.result;
    useSetSelectedTopQueryRowFromParams(setSelectedRow, rows);

    // Enhanced table settings with dynamicInnerRef for scrolling
    const tableSettings = React.useMemo(
        () => ({
            ...TOP_QUERIES_TABLE_SETTINGS,
            dynamicInnerRef: reactListRef,
        }),
        [],
    );

    // Use custom hook to handle scrolling to selected row
    useScrollToSelected({selectedRow, rows, reactListRef});

    const isDrawerVisible = selectedRow !== undefined;

    const getTopQueryUrl = React.useCallback(() => {
        if (selectedRow) {
            return generateShareableUrl(selectedRow);
        }
        return '';
    }, [selectedRow]);

    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isDrawerVisible) {
            inputRef.current?.blur();
        }
    }, [isDrawerVisible]);

    const drawerControls: DrawerControl[] = React.useMemo(
        () => [{type: 'copyLink', link: getTopQueryUrl()}, {type: 'close'}],
        [getTopQueryUrl],
    );

    const renderExtraControls = () => {
        return (
            <TableColumnSetup
                popupWidth={200}
                items={columnsToSelect}
                showStatus
                onUpdate={setColumns}
            />
        );
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls renderExtraControls={renderExtraControls}>
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
                    inputRef={inputRef}
                    onChange={handleTextSearchUpdate}
                    placeholder={i18n('filter.text.placeholder')}
                    className={b('search')}
                />
            </TableWithControlsLayout.Controls>

            {error ? <ResponseError error={parseQueryErrorToString(error)} /> : null}
            <TableWithControlsLayout.Table loading={isLoading}>
                <QueriesTableWithDrawer
                    columns={columnsToShow}
                    data={rows || []}
                    loading={isFetching && currentData === undefined}
                    columnsWidthLSKey={TOP_QUERIES_COLUMNS_WIDTH_LS_KEY}
                    emptyDataMessage={i18n('no-data')}
                    sortOrder={tableSort}
                    onSort={handleTableSort}
                    selectedRow={selectedRow}
                    onSelectedRowChange={setSelectedRow}
                    drawerControls={drawerControls}
                    drawerId="query-details"
                    storageKey="kv-top-queries-drawer-width"
                    tableSettings={tableSettings}
                />
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
