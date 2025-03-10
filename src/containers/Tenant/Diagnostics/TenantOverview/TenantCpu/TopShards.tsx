import {useLocation} from 'react-router-dom';

import {useComponent} from '../../../../../components/ComponentsProvider/ComponentsProvider';
import type {TopShardsColumnId} from '../../../../../components/ShardsTable/constants';
import {parseQuery} from '../../../../../routes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {topShardsApi} from '../../../../../store/reducers/tenantOverview/topShards/tenantOverviewTopShards';
import {TENANT_OVERVIEW_TABLES_SETTINGS} from '../../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../../utils/query';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

const columnsIds: TopShardsColumnId[] = ['TabletId', 'Path', 'CPUCores'];

interface TopShardsProps {
    tenantName: string;
    path: string;
}

export const TopShards = ({tenantName, path}: TopShardsProps) => {
    const ShardsTable = useComponent('ShardsTable');

    const location = useLocation();

    const query = parseQuery(location);

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData, isFetching, error} = topShardsApi.useGetTopShardsQuery(
        {database: tenantName, path},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const data = currentData?.resultSets?.[0]?.result || [];

    const title = getSectionTitle({
        entity: i18n('shards'),
        postfix: i18n('by-cpu-usage'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.topShards,
        }),
    });

    return (
        <TenantOverviewTableLayout
            title={title}
            loading={loading}
            error={parseQueryErrorToString(error)}
            withData={Boolean(currentData)}
        >
            <ShardsTable
                data={data}
                schemaPath={tenantName}
                database={tenantName}
                columnsIds={columnsIds}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
            />
        </TenantOverviewTableLayout>
    );
};
