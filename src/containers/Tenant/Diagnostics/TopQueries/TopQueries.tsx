import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import type {RadioButtonOption, SelectOption} from '@gravity-ui/uikit';
import {RadioButton, Select, TableColumnSetup} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router-dom';
import {StringParam, useQueryParam} from 'use-query-params';
import {z} from 'zod';

import type {DateRangeValues} from '../../../../components/DateRange';
import {DateRange} from '../../../../components/DateRange';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {parseQuery} from '../../../../routes';
import {setTopQueriesFilters} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {TimeFrame} from '../../../../store/reducers/executeTopQueries/types';
import {changeUserInput, setIsDirty} from '../../../../store/reducers/query/query';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {useChangeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {TenantTabsGroups, getTenantPath} from '../../TenantPages';

import {RunningQueriesData} from './RunningQueriesData';
import {TopQueriesData} from './TopQueriesData';
import {getRunningQueriesColumns, getTopQueriesColumns} from './columns/columns';
import {
    DEFAULT_RUNNING_QUERIES_COLUMNS,
    DEFAULT_TOP_QUERIES_COLUMNS,
    REQUIRED_RUNNING_QUERIES_COLUMNS,
    REQUIRED_TOP_QUERIES_COLUMNS,
    RUNNING_QUERIES_SELECTED_COLUMNS_LS_KEY,
    TOP_QUERIES_COLUMNS_TITLES,
    TOP_QUERIES_SELECTED_COLUMNS_LS_KEY,
} from './columns/constants';
import i18n from './i18n';

import './TopQueries.scss';

const b = cn('kv-top-queries');

const QueryModeIds = {
    top: 'top',
    running: 'running',
} as const;

const QUERY_MODE_OPTIONS: RadioButtonOption[] = [
    {
        value: QueryModeIds.top,
        get content() {
            return i18n('mode_top');
        },
    },
    {
        value: QueryModeIds.running,
        get content() {
            return i18n('mode_running');
        },
    },
];

const TimeFrameIds = {
    hour: 'hour',
    minute: 'minute',
} as const;

const queryModeSchema = z.nativeEnum(QueryModeIds).catch(QueryModeIds.top);
const timeFrameSchema = z.nativeEnum(TimeFrameIds).catch(TimeFrameIds.hour);

const TIME_FRAME_OPTIONS: SelectOption[] = [
    {
        value: TimeFrameIds.hour,
        content: i18n('timeframe_hour'),
    },
    {
        value: TimeFrameIds.minute,
        content: i18n('timeframe_minute'),
    },
];

const DEFAULT_TIME_FILTER_VALUE = {
    start: {
        value: 'now-6h',
        type: 'relative',
    },
    end: {
        value: 'now',
        type: 'relative',
    },
} as const;

interface TopQueriesProps {
    tenantName: string;
}

export const TopQueries = ({tenantName}: TopQueriesProps) => {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const history = useHistory();
    const [_queryMode = QueryModeIds.top, setQueryMode] = useQueryParam('queryMode', StringParam);
    const [_timeFrame = TimeFrameIds.hour, setTimeFrame] = useQueryParam('timeFrame', StringParam);

    const queryMode = queryModeSchema.parse(_queryMode);
    const timeFrame = timeFrameSchema.parse(_timeFrame);

    const isTopQueries = queryMode === QueryModeIds.top;

    const filters = useTypedSelector((state) => state.executeTopQueries);

    const applyRowClick = React.useCallback(
        (input: string) => {
            dispatch(changeUserInput({input}));
            dispatch(setIsDirty(false));

            const queryParams = parseQuery(location);

            const queryPath = getTenantPath({
                ...queryParams,
                [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                [TenantTabsGroups.queryTab]: TENANT_QUERY_TABS_ID.newQuery,
            });

            history.push(queryPath);
        },
        [dispatch, history, location],
    );

    const onRowClick = useChangeInputWithConfirmation(applyRowClick);

    const handleTextSearchUpdate = (text: string) => {
        dispatch(setTopQueriesFilters({text}));
    };

    const handleTimeFrameChange = (value: string[]) => {
        setTimeFrame(value[0] as TimeFrame);
    };

    const handleDateRangeChange = (value: DateRangeValues) => {
        dispatch(setTopQueriesFilters(value));
    };

    // Get columns based on query mode
    const columns: Column<any>[] = React.useMemo(() => {
        return isTopQueries ? getTopQueriesColumns() : getRunningQueriesColumns();
    }, [isTopQueries]);

    // Use selected columns hook
    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        isTopQueries
            ? TOP_QUERIES_SELECTED_COLUMNS_LS_KEY
            : RUNNING_QUERIES_SELECTED_COLUMNS_LS_KEY,
        TOP_QUERIES_COLUMNS_TITLES,
        isTopQueries ? DEFAULT_TOP_QUERIES_COLUMNS : DEFAULT_RUNNING_QUERIES_COLUMNS,
        isTopQueries ? REQUIRED_TOP_QUERIES_COLUMNS : REQUIRED_RUNNING_QUERIES_COLUMNS,
    );

    const DataComponent = isTopQueries ? TopQueriesData : RunningQueriesData;

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>
                <RadioButton
                    options={QUERY_MODE_OPTIONS}
                    value={queryMode}
                    onUpdate={setQueryMode}
                />
                {isTopQueries && (
                    <Select
                        options={TIME_FRAME_OPTIONS}
                        value={[timeFrame]}
                        onUpdate={handleTimeFrameChange}
                    />
                )}
                {isTopQueries && (
                    <DateRange
                        from={filters.from}
                        to={filters.to}
                        onChange={handleDateRangeChange}
                        defaultValue={DEFAULT_TIME_FILTER_VALUE}
                    />
                )}
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
            <DataComponent
                database={tenantName}
                onRowClick={onRowClick}
                rowClassName={b('row')}
                timeFrame={timeFrame}
                columns={columnsToShow}
            />
        </TableWithControlsLayout>
    );
};
