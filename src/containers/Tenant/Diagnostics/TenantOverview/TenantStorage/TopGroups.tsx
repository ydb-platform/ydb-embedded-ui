import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {topStorageGroupsApi} from '../../../../../store/reducers/tenantOverview/topStorageGroups/topStorageGroups';
import {DEFAULT_POLLING_INTERVAL} from '../../../../../utils/constants';
import {useSearchQuery, useTypedSelector} from '../../../../../utils/hooks';
import {getStorageTopGroupsColumns} from '../../../../Storage/StorageGroups/getStorageGroupsColumns';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopGroupsProps {
    tenant?: string;
}

export function TopGroups({tenant}: TopGroupsProps) {
    const query = useSearchQuery();

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const columns = getStorageTopGroupsColumns();

    const {currentData, isFetching, error} = topStorageGroupsApi.useGetTopStorageGroupsQuery(
        {tenant},
        {pollingInterval: autorefresh ? DEFAULT_POLLING_INTERVAL : 0},
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
            data={topGroups || []}
            columns={columns}
            title={title}
            loading={loading}
            error={error}
        />
    );
}
