import React from 'react';

import {useHistory, useLocation} from 'react-router-dom';

import type {DateRangeValues} from '../../../../components/DateRange';
import {DateRange} from '../../../../components/DateRange';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {parseQuery} from '../../../../routes';
import {changeUserInput} from '../../../../store/reducers/executeQuery';
import {
    setTopQueriesFilters,
    topQueriesApi,
} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {isSortableTopQueriesProperty} from '../../../../utils/diagnostics';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';
import {TenantTabsGroups, getTenantPath} from '../../TenantPages';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';
import {isColumnEntityType} from '../../utils/schema';

import {TOP_QUERIES_COLUMNS_WIDTH_LS_KEY, getTopQueriesColumns} from './getTopQueriesColumns';
import i18n from './i18n';

import './TopQueries.scss';

const b = cn('kv-top-queries');

interface TopQueriesProps {
    tenantName: string;
    type?: EPathType;
}

export const TopQueries = ({tenantName, type}: TopQueriesProps) => {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const history = useHistory();

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const filters = useTypedSelector((state) => state.executeTopQueries);
    const {currentData, isFetching, error} = topQueriesApi.useGetTopQueriesQuery(
        {
            database: tenantName,
            filters,
        },
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && currentData === undefined;
    const {result: data} = currentData || {};

    const rawColumns = getTopQueriesColumns();
    const columns = rawColumns.map((column) => ({
        ...column,
        sortable: isSortableTopQueriesProperty(column.name),
    }));

    const handleRowClick = React.useCallback(
        (row: any) => {
            const {QueryText: input} = row;

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

    const renderContent = () => {
        if (error) {
            return <div className="error">{parseQueryErrorToString(error)}</div>;
        }

        if (!data || isColumnEntityType(type)) {
            return i18n('no-data');
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={TOP_QUERIES_COLUMNS_WIDTH_LS_KEY}
                columns={columns}
                data={data}
                settings={QUERY_TABLE_SETTINGS}
                onRowClick={handleRowClick}
                rowClassName={() => b('row')}
            />
        );
    };

    const renderControls = () => {
        return (
            <React.Fragment>
                <Search
                    value={filters.text}
                    onChange={handleTextSearchUpdate}
                    placeholder={i18n('filter.text.placeholder')}
                    className={b('search')}
                />
                <DateRange from={filters.from} to={filters.to} onChange={handleDateRangeChange} />
            </React.Fragment>
        );
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table loading={loading}>
                {renderContent()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
