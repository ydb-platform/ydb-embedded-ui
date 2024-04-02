import React from 'react';

import {useHistory, useLocation} from 'react-router';

import {parseQuery} from '../../../../../routes';
import {changeUserInput} from '../../../../../store/reducers/executeQuery';
import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../../store/reducers/tenant/constants';
import {
    fetchTenantOverviewTopQueries,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/topQueries/tenantOverviewTopQueries';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {getTenantOverviewTopQueriesColumns} from '../../TopQueries/getTopQueriesColumns';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopQueriesProps {
    path: string;
}

export function TopQueries({path}: TopQueriesProps) {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const history = useHistory();

    const query = parseQuery(location);

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

    const title = getSectionTitle({
        entity: i18n('queries'),
        postfix: i18n('by-cpu-time'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.topQueries,
        }),
    });

    return (
        <TenantOverviewTableLayout
            data={data || []}
            columns={columns}
            onRowClick={handleRowClick}
            title={title}
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
            tableClassNameModifiers={{'top-queries': true}}
        />
    );
}
