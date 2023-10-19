import {useCallback, useEffect, useRef, useState} from 'react';
import {useDispatch} from 'react-redux';
import {useHistory, useLocation} from 'react-router';
import cn from 'bem-cn-lite';

import DataTable from '@gravity-ui/react-data-table';
import {Loader} from '@gravity-ui/uikit';

import {DateRange, DateRangeValues} from '../../../../components/DateRange';
import {Search} from '../../../../components/Search';

import {changeUserInput} from '../../../../store/reducers/executeQuery';

import type {EPathType} from '../../../../types/api/schema';
import type {IQueryResult} from '../../../../types/store/query';
import type {ITopQueriesFilters} from '../../../../store/reducers/executeTopQueries/types';

import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import {
    setTopQueriesFilters,
    setTopQueriesState,
    fetchTopQueries,
} from '../../../../store/reducers/executeTopQueries/executeTopQueries';
import {HOUR_IN_SECONDS} from '../../../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {prepareQueryError} from '../../../../utils/query';
import {parseQuery} from '../../../../routes';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';
import {isSortableTopQueriesProperty} from '../../../../utils/diagnostics';
import {isColumnEntityType} from '../../utils/schema';
import {TenantTabsGroups, getTenantPath} from '../../TenantPages';
import {getTopQueriesColumns} from './getTopQueriesColumns';

import i18n from './i18n';
import './TopQueries.scss';

const b = cn('kv-top-queries');

interface TopQueriesProps {
    path: string;
    type?: EPathType;
}

export const TopQueries = ({path, type}: TopQueriesProps) => {
    const dispatch = useDispatch();
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

    const preventFetch = useRef(false);

    // some filters sync between redux state and URL
    // component state is for default values,
    // default values are determined from the query response, and should not propagate to URL
    const [filters, setFilters] = useState<ITopQueriesFilters>(storeFilters);

    useEffect(() => {
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

            // @ts-expect-error
            // typed dispatch required, remove error expectation after adding it
            dispatch(fetchTopQueries({database: path, filters})).then(
                setDefaultFiltersFromResponse,
            );
        },
        [dispatch, filters, path],
        autorefresh,
    );

    const handleRowClick = useCallback(
        (row) => {
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
