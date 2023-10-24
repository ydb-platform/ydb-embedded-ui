import {useDispatch} from 'react-redux';
import {useHistory, useLocation} from 'react-router';
import {useCallback} from 'react';

import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../../store/reducers/tenant/constants';
import {
    fetchTenantOverviewTopQueries,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topQueries/tenantOverviewTopQueries';
import {changeUserInput} from '../../../../../store/reducers/executeQuery';
import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {parseQuery} from '../../../../../routes';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {getTenantOverviewTopQueriesColumns} from '../../TopQueries/getTopQueriesColumns';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

interface TopQueriesProps {
    path: string;
}

export function TopQueries({path}: TopQueriesProps) {
    const dispatch = useDispatch();
    const location = useLocation();
    const history = useHistory();

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const {
        loading,
        wasLoaded,
        error,
        data: {result: data = undefined} = {},
    } = useTypedSelector((state) => state.tenantOverviewTopQueries);
    const columns = getTenantOverviewTopQueriesColumns();

    useAutofetcher(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(fetchTenantOverviewTopQueries(path));
        },
        [dispatch, path],
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

    return (
        <TenantOverviewTableLayout
            data={data || []}
            columns={columns}
            onRowClick={handleRowClick}
            title="Top queries by cpu time"
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
            tableClassNameModifiers={{'top-queries': true}}
        />
    );
}
