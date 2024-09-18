import {nodesApi} from '../../../../../store/reducers/nodes/nodes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../../utils/constants';
import {useAutoRefreshInterval, useSearchQuery} from '../../../../../utils/hooks';
import {NODES_COLUMNS_WIDTH_LS_KEY} from '../../../../Nodes/columns/constants';
import {getTopNodesByCpuColumns} from '../../../../Nodes/columns/getNodesColumns';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopNodesByCpuProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByCpu({tenantName, additionalNodesProps}: TopNodesByCpuProps) {
    const query = useSearchQuery();

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const columns = getTopNodesByCpuColumns(additionalNodesProps?.getNodeRef);

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            tenant: tenantName,
            type: 'any',
            sort: '-CPU',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const topNodes = currentData?.Nodes || [];

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
            data={topNodes}
            columns={columns}
            title={title}
            loading={loading}
            error={error}
            emptyDataMessage={i18n('top-nodes.empty-data')}
        />
    );
}
