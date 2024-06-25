import {selectAutoRefreshInterval} from '../../../../../store/reducers/autoRefreshControl';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {topNodesApi} from '../../../../../store/reducers/tenantOverview/topNodes/topNodes';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {useSearchQuery, useTypedSelector} from '../../../../../utils/hooks';
import {
    NODES_COLUMNS_WIDTH_LS_KEY,
    getTopNodesByCpuColumns,
} from '../../../../Nodes/getNodesColumns';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopNodesByCpuProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByCpu({path, additionalNodesProps}: TopNodesByCpuProps) {
    const query = useSearchQuery();

    const autoRefreshInterval = useTypedSelector(selectAutoRefreshInterval);
    const columns = getTopNodesByCpuColumns(additionalNodesProps?.getNodeRef);

    const {currentData, isFetching, error} = topNodesApi.useGetTopNodesQuery(
        {tenant: path, sortValue: 'CPU'},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const topNodes = currentData;

    const title = getSectionTitle({
        entity: i18n('nodes'),
        postfix: i18n('by-pools-usage'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.nodes,
        }),
    });

    return (
        <TenantOverviewTableLayout
            columnsWidthLSKey={NODES_COLUMNS_WIDTH_LS_KEY}
            data={topNodes || []}
            columns={columns}
            title={title}
            loading={loading}
            error={error}
            emptyDataMessage={i18n('top-nodes.empty-data')}
        />
    );
}
