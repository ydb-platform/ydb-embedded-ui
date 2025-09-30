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
import type {
    GetNodesColumnsParams,
    NodesColumn,
} from '../../../../../components/nodesColumns/types';
import {nodesApi} from '../../../../../store/reducers/nodes/nodes';
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
): [NodesColumn[], NodesRequiredField[]] {
    const columns: NodesColumn[] = [
        getNodeIdColumn(),
        getHostColumn(params),
        getUptimeColumn(),
        getLoadColumn(),
        getMemoryColumn(),
        getSessionsColumn(),
        getTabletsColumn(params),
    ];

    const columnsIds = columns.map((column) => column.name);
    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

    return [columns, dataFieldsRequired];
}

interface TopNodesByMemoryProps {
    database: string;
}

export function TopNodesByMemory({database}: TopNodesByMemoryProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [columns, fieldsRequired] = getTopNodesByMemoryColumns({database});

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            tenant: database,
            type: 'any',
            tablets: true,
            sort: '-Memory',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            fieldsRequired,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const topNodes = currentData?.nodes || [];

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
