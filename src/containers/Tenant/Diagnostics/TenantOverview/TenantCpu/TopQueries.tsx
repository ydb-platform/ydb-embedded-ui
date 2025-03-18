import React from 'react';

import {useHistory, useLocation} from 'react-router-dom';

import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {parseQuery} from '../../../../../routes';
import {
    setTopQueriesFilters,
    topQueriesApi,
} from '../../../../../store/reducers/executeTopQueries/executeTopQueries';
import {changeUserInput} from '../../../../../store/reducers/query/query';
import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../../store/reducers/tenant/constants';
import {TENANT_OVERVIEW_TABLES_SETTINGS} from '../../../../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch} from '../../../../../utils/hooks';
import {useChangeInputWithConfirmation} from '../../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {parseQueryErrorToString} from '../../../../../utils/query';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {getTenantOverviewTopQueriesColumns} from '../../TopQueries/columns/columns';
import {TOP_QUERIES_COLUMNS_WIDTH_LS_KEY} from '../../TopQueries/columns/constants';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';
import {b} from '../utils';

interface TopQueriesProps {
    tenantName: string;
}

export function TopQueries({tenantName}: TopQueriesProps) {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const history = useHistory();

    const query = parseQuery(location);

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const columns = React.useMemo(() => {
        return getTenantOverviewTopQueriesColumns();
    }, []);

    const {currentData, isFetching, error} = topQueriesApi.useGetTopQueriesQuery(
        {database: tenantName},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const data = currentData?.resultSets?.[0]?.result || [];

    const applyRowClick = React.useCallback(
        (row: any) => {
            const {QueryText: input} = row;

            dispatch(changeUserInput({input, isDirty: false}));

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

    const handleRowClick = useChangeInputWithConfirmation(applyRowClick);

    const title = getSectionTitle({
        entity: i18n('queries'),
        postfix: i18n('by-cpu-time', {executionPeriod: i18n('executed-last-hour')}),
        onClick: () => {
            dispatch(setTopQueriesFilters({from: undefined, to: undefined}));
        },
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.topQueries,
        }),
    });

    return (
        <TenantOverviewTableLayout
            title={title}
            loading={loading}
            error={parseQueryErrorToString(error)}
            withData={Boolean(currentData)}
        >
            <ResizeableDataTable
                columnsWidthLSKey={TOP_QUERIES_COLUMNS_WIDTH_LS_KEY}
                data={data}
                columns={columns}
                onRowClick={handleRowClick}
                rowClassName={() => b('top-queries-row')}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
            />
        </TenantOverviewTableLayout>
    );
}
