import {topQueriesApi} from '../../../../../store/reducers/executeTopQueries/executeTopQueries';
import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../../utils/query';
import {QueriesTableWithDrawer} from '../../TopQueries/QueriesTableWithDrawer';
import {getTenantOverviewTopQueriesColumns} from '../../TopQueries/columns/columns';
import {TOP_QUERIES_COLUMNS_WIDTH_LS_KEY} from '../../TopQueries/columns/constants';
import {useTopQueriesSort} from '../../TopQueries/hooks/useTopQueriesSort';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

interface TopQueriesProps {
    tenantName: string;
}

const columns = getTenantOverviewTopQueriesColumns();

export function TopQueries({tenantName}: TopQueriesProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {backendSort} = useTopQueriesSort();

    const {currentData, isFetching, error} = topQueriesApi.useGetTopQueriesQuery(
        {
            database: tenantName,
            timeFrame: 'hour',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            sortOrder: backendSort,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const data = currentData?.resultSets?.[0]?.result || [];

    return (
        <TenantOverviewTableLayout
            loading={loading}
            error={parseQueryErrorToString(error)}
            withData={Boolean(currentData)}
        >
            <QueriesTableWithDrawer
                columnsWidthLSKey={TOP_QUERIES_COLUMNS_WIDTH_LS_KEY}
                data={data}
                columns={columns}
                tableSettings={TENANT_OVERVIEW_TABLES_SETTINGS}
                drawerId="tenant-overview-query-details"
                storageKey="tenant-overview-queries-drawer-width"
            />
        </TenantOverviewTableLayout>
    );
}
