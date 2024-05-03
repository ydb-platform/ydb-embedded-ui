import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {Loader} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router';

import type {DateRangeValues} from '../../../../components/DateRange';
import {DateRange} from '../../../../components/DateRange';
import {Search} from '../../../../components/Search';
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
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {prepareQueryError} from '../../../../utils/query';
import {TenantTabsGroups, getTenantPath} from '../../TenantPages';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';
import {isColumnEntityType} from '../../utils/schema';

import {getTopQueriesColumns} from './getTopQueriesColumns';
import i18n from './i18n';

import './TopQueries.scss';

const b = cn('kv-top-queries');

interface TopQueriesProps {
    path: string;
    type?: EPathType;
}

export const TopQueries = ({path, type}: TopQueriesProps) => {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const history = useHistory();

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const filters = useTypedSelector((state) => state.executeTopQueries);
    const {currentData, isFetching, error} = topQueriesApi.useGetTopQueriesQuery(
        {
            database: path,
            filters,
        },
        {pollingInterval: autorefresh},
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

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return renderLoader();
        }

        if (error && typeof error === 'object' && !(error as any).isCancelled) {
            return <div className="error">{prepareQueryError(error)}</div>;
        }

        if (!data || isColumnEntityType(type)) {
            return i18n('no-data');
        }

        return (
            <div className={b('table')}>
                <DataTable
                    columns={columns}
                    data={data}
                    settings={QUERY_TABLE_SETTINGS}
                    onRowClick={handleRowClick}
                    theme="yandex-cloud"
                />
            </div>
        );
    };

    return (
        <div className={b()}>
            <div className={b('controls')}>
                <Search
                    value={filters.text}
                    onChange={handleTextSearchUpdate}
                    placeholder={i18n('filter.text.placeholder')}
                    className={b('search')}
                />
                <DateRange from={filters.from} to={filters.to} onChange={handleDateRangeChange} />
            </div>
            {renderContent()}
        </div>
    );
};
