import type {Column} from '@gravity-ui/react-data-table';

import {
    getHostColumn,
    getLoadColumn,
    getNodeIdColumn,
    getVersionColumn,
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

function getTopNodesByLoadColumns(
    params: GetNodesColumnsParams,
): [Column<NodesPreparedEntity>[], NodesRequiredField[]] {
    const hostColumn = {
        ...getHostColumn<NodesPreparedEntity>(params),
        width: undefined,
    };

    const columns = [
        getLoadColumn<NodesPreparedEntity>(),
        getNodeIdColumn<NodesPreparedEntity>(),
        hostColumn,
        getVersionColumn<NodesPreparedEntity>(),
    ];

    const preparedColumns = columns.map((column) => ({
        ...column,
        sortable: false,
    }));

    const columnsIds = preparedColumns.map((column) => column.name);
    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

    return [preparedColumns, dataFieldsRequired];
}

interface TopNodesByLoadProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByLoad({tenantName, additionalNodesProps}: TopNodesByLoadProps) {
    const query = useSearchQuery();

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [columns, fieldsRequired] = getTopNodesByLoadColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
        database: tenantName,
    });

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            tenant: tenantName,
            type: 'any',
            sort: '-LoadAverage',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            tablets: false,
            fieldsRequired,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const topNodes = currentData?.Nodes || [];

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
            data={topNodes}
            columns={columns}
            title={title}
            loading={loading}
            error={error}
            emptyDataMessage={i18n('top-nodes.empty-data')}
        />
    );
}
