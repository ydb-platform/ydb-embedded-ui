import React from 'react';

import {Drawer, DrawerItem} from '@gravity-ui/navigation';
import type {RadioButtonOption} from '@gravity-ui/uikit';
import {RadioButton} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router-dom';
import {StringParam, useQueryParam} from 'use-query-params';
import {z} from 'zod';

import type {DateRangeValues} from '../../../../components/DateRange';
import {parseQuery} from '../../../../routes';
import {setTopQueriesFilters} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {TimeFrame} from '../../../../store/reducers/executeTopQueries/types';
import {changeUserInput, setIsDirty} from '../../../../store/reducers/query/query';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch} from '../../../../utils/hooks';
import {useChangeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {TenantTabsGroups, getTenantPath} from '../../TenantPages';

import {QueryDetails} from './QueryDetails';
import {RunningQueriesData} from './RunningQueriesData';
import {TopQueriesData} from './TopQueriesData';
import {TimeFrameIds} from './constants';
import i18n from './i18n';

import './TopQueries.scss';

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

const queryModeSchema = z.nativeEnum(QueryModeIds).catch(QueryModeIds.top);
const timeFrameSchema = z.nativeEnum(TimeFrameIds).catch(TimeFrameIds.hour);

interface TopQueriesProps {
    tenantName: string;
}

const DRAWER_WIDTH_KEY = 'kv-top-queries-drawer-width';
const b = cn('kv-top-queries');

export const TopQueries = ({tenantName}: TopQueriesProps) => {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const history = useHistory();
    const [_queryMode = QueryModeIds.top, setQueryMode] = useQueryParam('queryMode', StringParam);
    const [_timeFrame = TimeFrameIds.hour, setTimeFrame] = useQueryParam('timeFrame', StringParam);

    const queryMode = queryModeSchema.parse(_queryMode);
    const timeFrame = timeFrameSchema.parse(_timeFrame);

    const isTopQueries = queryMode === QueryModeIds.top;

    const [selectedRow, setSelectedRow] = React.useState<KeyValueRow | null>(null);
    const [isDrawerVisible, setIsDrawerVisible] = React.useState(false);
    const [drawerWidth, setDrawerWidth] = React.useState(() => {
        const savedWidth = localStorage.getItem(DRAWER_WIDTH_KEY);
        return savedWidth ? Number(savedWidth) : 400;
    });

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
        setTimeFrame(value[0] as TimeFrame, 'replaceIn');
    };

    const handleDateRangeChange = (value: DateRangeValues) => {
        dispatch(setTopQueriesFilters(value));
    };

    const renderQueryModeControl = React.useCallback(() => {
        return (
            <RadioButton options={QUERY_MODE_OPTIONS} value={queryMode} onUpdate={setQueryMode} />
        );
    }, [queryMode, setQueryMode]);

    const handleRowClick = (row: KeyValueRow) => {
        setSelectedRow(row);
        setIsDrawerVisible(true);
    };

    const handleOpenInEditor = () => {
        if (selectedRow) {
            onRowClick(selectedRow.QueryText as string);
        }
    };

    const handleCloseDetails = () => {
        setIsDrawerVisible(false);
    };

    const handleResizeDrawer = (width: number) => {
        setDrawerWidth(width);
        localStorage.setItem(DRAWER_WIDTH_KEY, width.toString());
    };

    return (
        <React.Fragment>
            {isTopQueries ? (
                <TopQueriesData
                    tenantName={tenantName}
                    timeFrame={timeFrame}
                    renderQueryModeControl={renderQueryModeControl}
                    handleRowClick={handleRowClick}
                    handleTimeFrameChange={handleTimeFrameChange}
                    handleDateRangeChange={handleDateRangeChange}
                    handleTextSearchUpdate={handleTextSearchUpdate}
                />
            ) : (
                <RunningQueriesData
                    tenantName={tenantName}
                    renderQueryModeControl={renderQueryModeControl}
                    handleRowClick={handleRowClick}
                    handleTextSearchUpdate={handleTextSearchUpdate}
                />
            )}
            <Drawer onEscape={handleCloseDetails} onVeilClick={handleCloseDetails} hideVeil>
                <DrawerItem
                    id="query-details"
                    visible={isDrawerVisible}
                    resizable
                    width={drawerWidth}
                    onResize={handleResizeDrawer}
                    direction="right"
                    className={b('drawer-item')}
                >
                    {selectedRow && (
                        <QueryDetails
                            row={selectedRow}
                            onClose={handleCloseDetails}
                            onOpenInEditor={handleOpenInEditor}
                        />
                    )}
                </DrawerItem>
            </Drawer>
        </React.Fragment>
    );
};
