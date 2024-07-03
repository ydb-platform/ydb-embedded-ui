import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {topStorageGroupsApi} from '../../../../../store/reducers/tenantOverview/topStorageGroups/topStorageGroups';
import {useAutoRefreshInterval, useSearchQuery} from '../../../../../utils/hooks';
import {
    STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY,
    getStorageTopGroupsColumns,
} from '../../../../Storage/StorageGroups/getStorageGroupsColumns';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopGroupsProps {
    tenant?: string;
}

export function TopGroups({tenant}: TopGroupsProps) {
    const query = useSearchQuery();

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const columns = getStorageTopGroupsColumns();

    const {currentData, isFetching, error} = topStorageGroupsApi.useGetTopStorageGroupsQuery(
        {tenant},
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && currentData === undefined;
    const topGroups = currentData;

    const title = getSectionTitle({
        entity: i18n('groups'),
        postfix: i18n('by-usage'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.storage,
        }),
    });

    return (
        <TenantOverviewTableLayout
            columnsWidthLSKey={STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY}
            data={topGroups || []}
            columns={columns}
            title={title}
            loading={loading}
            error={error}
        />
    );
}
