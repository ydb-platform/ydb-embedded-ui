import React from 'react';

import type {RadioButtonOption} from '@gravity-ui/uikit';
import {RadioButton} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router-dom';
import {StringParam, useQueryParam} from 'use-query-params';
import {z} from 'zod';

import type {DateRangeValues} from '../../../../components/DateRange';
import {DateRange} from '../../../../components/DateRange';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {parseQuery} from '../../../../routes';
import {changeUserInput} from '../../../../store/reducers/executeQuery';
import {setTopQueriesFilters} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../TenantPages';

import {RunningQueriesData} from './RunningQueriesData';
import {TopQueriesData} from './TopQueriesData';
import i18n from './i18n';

import './TopQueries.scss';

const b = cn('kv-top-queries');

const QueryModeIds = {
    top: 'top',
    running: 'running',
};

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

interface TopQueriesProps {
    tenantName: string;
}

export const TopQueries = ({tenantName}: TopQueriesProps) => {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const history = useHistory();
    const [_queryMode = 'top', setQueryMode] = useQueryParam('queryMode', StringParam);

    const queryMode = queryModeSchema.parse(_queryMode);

    const isTopQueries = queryMode === 'top';

    const filters = useTypedSelector((state) => state.executeTopQueries);

    const onRowClick = React.useCallback(
        (input: string) => {
            dispatch(changeUserInput({input}));

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

    const handleTextSearchUpdate = (text: string) => {
        dispatch(setTopQueriesFilters({text}));
    };

    const handleDateRangeChange = (value: DateRangeValues) => {
        dispatch(setTopQueriesFilters(value));
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>
                <RadioButton
                    options={QUERY_MODE_OPTIONS}
                    value={queryMode}
                    onUpdate={setQueryMode}
                />
                <Search
                    value={filters.text}
                    onChange={handleTextSearchUpdate}
                    placeholder={i18n('filter.text.placeholder')}
                    className={b('search')}
                />
                {isTopQueries ? (
                    <DateRange
                        from={filters.from}
                        to={filters.to}
                        onChange={handleDateRangeChange}
                    />
                ) : null}
            </TableWithControlsLayout.Controls>
            {isTopQueries ? (
                <TopQueriesData database={tenantName} onRowClick={onRowClick} />
            ) : (
                <RunningQueriesData database={tenantName} />
            )}
        </TableWithControlsLayout>
    );
};
