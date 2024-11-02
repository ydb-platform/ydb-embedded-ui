import type {Column} from '@gravity-ui/react-data-table';

import {
    getHostColumn,
    getLoadColumn,
    getMemoryDetailedColumn,
    getNodeIdColumn,
    getSessionsColumn,
    getTabletsColumn,
    getUptimeColumn,
} from '../../../../../components/nodesColumns/columns';
import {
    NODES_COLUMNS_TO_DATA_FIELDS,
    NODES_COLUMNS_WIDTH_LS_KEY,
} from '../../../../../components/nodesColumns/constants';
import type {GetNodesColumnsParams} from '../../../../../components/nodesColumns/types';
import {nodesApi} from '../../../../../store/reducers/nodes/nodes';
import type {NodesPreparedEntity} from '../../../../../store/reducers/nodes/types';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import type {NodesRequiredField} from '../../../../../types/api/nodes';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../../utils/constants';
import {useAutoRefreshInterval, useSearchQuery} from '../../../../../utils/hooks';
import {getRequiredDataFields} from '../../../../../utils/tableUtils/getRequiredDataFields';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

function getTopNodesByMemoryColumns(
    params: GetNodesColumnsParams,
): [Column<NodesPreparedEntity>[], NodesRequiredField[]] {
    const columns = [
        getNodeIdColumn<NodesPreparedEntity>(),
        getHostColumn<NodesPreparedEntity>(params),
        getUptimeColumn<NodesPreparedEntity>(),
        getLoadColumn<NodesPreparedEntity>(),
        getMemoryDetailedColumn<NodesPreparedEntity>(),
        getSessionsColumn<NodesPreparedEntity>(),
        getTabletsColumn<NodesPreparedEntity>(params),
    ];

    const preparedColumns = columns.map((column) => ({
        ...column,
        sortable: false,
    }));

    const columnsIds = preparedColumns.map((column) => column.name);
    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

    return [preparedColumns, dataFieldsRequired];
}

interface TopNodesByMemoryProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByMemory({tenantName, additionalNodesProps}: TopNodesByMemoryProps) {
    const query = useSearchQuery();

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [columns, fieldsRequired] = getTopNodesByMemoryColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
        database: tenantName,
    });

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            tenant: tenantName,
            type: 'any',
            tablets: true,
            sort: '-Memory',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            fieldsRequired,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const topNodes = currentData?.Nodes || [];

    const title = getSectionTitle({
        entity: i18n('nodes'),
        postfix: i18n('by-memory'),
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
