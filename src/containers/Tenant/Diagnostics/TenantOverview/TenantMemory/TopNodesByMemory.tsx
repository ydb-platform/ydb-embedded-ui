import type {Column} from '@gravity-ui/react-data-table';

import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {
    getHostColumn,
    getLoadColumn,
    getMemoryColumn,
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
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import type {NodesRequiredField} from '../../../../../types/api/nodes';
import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {getRequiredDataFields} from '../../../../../utils/tableUtils/getRequiredDataFields';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import i18n from '../i18n';

function getTopNodesByMemoryColumns(
    params: GetNodesColumnsParams,
): [Column<NodesPreparedEntity>[], NodesRequiredField[]] {
    const columns = [
        getNodeIdColumn<NodesPreparedEntity>(),
        getHostColumn<NodesPreparedEntity>(params),
        getUptimeColumn<NodesPreparedEntity>(),
        getLoadColumn<NodesPreparedEntity>(),
        getMemoryColumn<NodesPreparedEntity>(),
        getSessionsColumn<NodesPreparedEntity>(),
        getTabletsColumn<NodesPreparedEntity>(params),
    ];

    const columnsIds = columns.map((column) => column.name);
    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

    return [columns, dataFieldsRequired];
}

interface TopNodesByMemoryProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByMemory({tenantName, additionalNodesProps}: TopNodesByMemoryProps) {
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
