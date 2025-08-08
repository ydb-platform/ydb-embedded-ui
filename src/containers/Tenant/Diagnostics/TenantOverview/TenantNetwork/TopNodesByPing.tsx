import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {NODES_COLUMNS_WIDTH_LS_KEY} from '../../../../../components/nodesColumns/constants';
import {nodesApi} from '../../../../../store/reducers/nodes/nodes';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import i18n from '../i18n';

import {getTopNodesByPingColumns} from './columns';

interface TopNodesByPingProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByPing({tenantName, additionalNodesProps}: TopNodesByPingProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [columns, fieldsRequired] = getTopNodesByPingColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
        database: tenantName,
    });

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            tenant: tenantName,
            type: 'any',
            sort: '-PingTime',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            tablets: false,
            fieldsRequired: fieldsRequired,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const topNodes = currentData?.Nodes || [];

    return (
        <TenantOverviewTableLayout loading={loading} error={error} withData={Boolean(currentData)}>
            <ResizeableDataTable
                columnsWidthLSKey={NODES_COLUMNS_WIDTH_LS_KEY}
                data={topNodes}
                columns={columns}
                emptyDataMessage={i18n('top-nodes.empty-data')}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
            />
        </TenantOverviewTableLayout>
    );
}
