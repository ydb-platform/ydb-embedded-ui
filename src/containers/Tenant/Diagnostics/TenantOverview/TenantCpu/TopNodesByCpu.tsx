import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {
    getHostColumn,
    getNodeIdColumn,
    getPoolsColumn,
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

function getTopNodesByCpuColumns(
    params: GetNodesColumnsParams,
): [NodesColumn[], NodesRequiredField[]] {
    const hostColumn: NodesColumn = {
        ...getHostColumn(params),
        width: undefined,
    };

    const columns: NodesColumn[] = [getPoolsColumn(), getNodeIdColumn(), hostColumn];

    const columnsIds = columns.map((column) => column.name);
    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

    return [columns, dataFieldsRequired];
}

interface TopNodesByCpuProps {
    database: string;
}

export function TopNodesByCpu({database}: TopNodesByCpuProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [columns, fieldsRequired] = getTopNodesByCpuColumns({database});

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            tenant: database,
            type: 'any',
            sort: '-CPU',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            tablets: false,
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
