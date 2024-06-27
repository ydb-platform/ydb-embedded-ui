import {useLocation} from 'react-router';

import {parseQuery} from '../../../../../routes';
import {selectAutoRefreshInterval} from '../../../../../store/reducers/autoRefreshControl';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {topShardsApi} from '../../../../../store/reducers/tenantOverview/topShards/tenantOverviewTopShards';
import {useTypedSelector} from '../../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../../utils/query';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {
    TOP_SHARDS_COLUMNS_WIDTH_LS_KEY,
    getTopShardsColumns,
} from '../../TopShards/getTopShardsColumns';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopShardsProps {
    tenantName: string;
    path: string;
}

export const TopShards = ({tenantName, path}: TopShardsProps) => {
    const location = useLocation();

    const query = parseQuery(location);

    const autoRefreshInterval = useTypedSelector(selectAutoRefreshInterval);

    const {currentData, isFetching, error} = topShardsApi.useGetTopShardsQuery(
        {database: tenantName, path},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const {result: data} = currentData || {};

    const columns = getTopShardsColumns(tenantName, location);

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
            columnsWidthLSKey={TOP_SHARDS_COLUMNS_WIDTH_LS_KEY}
            data={data || []}
            columns={columns}
            title={title}
            loading={loading}
            error={parseQueryErrorToString(error)}
        />
    );
};
