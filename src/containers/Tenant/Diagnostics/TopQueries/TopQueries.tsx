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
    fetchTopQueries,
    setTopQueriesFilters,
    setTopQueriesState,
} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import type {ITopQueriesFilters} from '../../../../store/reducers/executeTopQueries/types';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import type {EPathType} from '../../../../types/api/schema';
import type {IQueryResult} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {HOUR_IN_SECONDS} from '../../../../utils/constants';
import {isSortableTopQueriesProperty} from '../../../../utils/diagnostics';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
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

    const {
        loading,
        wasLoaded,
        error,
        data: {result: data = undefined} = {},
        filters: storeFilters,
    } = useTypedSelector((state) => state.executeTopQueries);
    const rawColumns = getTopQueriesColumns();

    const preventFetch = React.useRef(false);

    // some filters sync between redux state and URL
    // component state is for default values,
    // default values are determined from the query response, and should not propagate to URL
    const [filters, setFilters] = React.useState<ITopQueriesFilters>(storeFilters);

    React.useEffect(() => {
        dispatch(setTopQueriesFilters(filters));
    }, [dispatch, filters]);

    const columns = rawColumns.map((column) => ({
        ...column,
        sortable: isSortableTopQueriesProperty(column.name),
    }));

    const setDefaultFiltersFromResponse = (responseData?: IQueryResult) => {
        const intervalEnd = responseData?.result?.[0]?.IntervalEnd;

        if (intervalEnd) {
            const to = new Date(intervalEnd).getTime();
            const from = new Date(to - HOUR_IN_SECONDS * 1000).getTime();

            setFilters((currentFilters) => {
                // request without filters returns the latest interval with data
                // only in this case should update filters in ui
                // also don't update if user already interacted with controls
                const shouldUpdateFilters = !currentFilters.from && !currentFilters.to;

                if (!shouldUpdateFilters) {
                    return currentFilters;
                }

                preventFetch.current = true;

                return {...currentFilters, from, to};
            });
        }
    };

    useAutofetcher(
        (isBackground) => {
            if (preventFetch.current) {
                preventFetch.current = false;
                return;
            }

            if (!isBackground) {
                dispatch(
                    setTopQueriesState({
                        wasLoaded: false,
                        data: undefined,
                    }),
                );
            }

            dispatch(fetchTopQueries({database: path, filters})).then(
                setDefaultFiltersFromResponse,
            );
        },
        [dispatch, filters, path],
        autorefresh,
    );

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
        setFilters((currentFilters) => ({...currentFilters, text}));
    };

    const handleDateRangeChange = (value: DateRangeValues) => {
        setFilters((currentFilters) => ({...currentFilters, ...value}));
    };

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderContent = () => {
        if (loading && !wasLoaded) {
            return renderLoader();
        }

        if (error && !error.isCancelled) {
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
