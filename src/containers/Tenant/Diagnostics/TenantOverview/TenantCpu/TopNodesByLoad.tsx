import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {topNodesApi} from '../../../../../store/reducers/tenantOverview/topNodes/topNodes';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {useAutoRefreshInterval, useSearchQuery} from '../../../../../utils/hooks';
import {
    NODES_COLUMNS_WIDTH_LS_KEY,
    getTopNodesByLoadColumns,
} from '../../../../Nodes/getNodesColumns';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopNodesByLoadProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByLoad({tenantName, additionalNodesProps}: TopNodesByLoadProps) {
    const query = useSearchQuery();

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const columns = getTopNodesByLoadColumns(additionalNodesProps?.getNodeRef);

    const {currentData, isFetching, error} = topNodesApi.useGetTopNodesQuery(
        {tenant: tenantName, sortValue: 'LoadAverage'},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const topNodes = currentData;

    const title = getSectionTitle({
        entity: i18n('nodes'),
        postfix: i18n('by-load'),
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
