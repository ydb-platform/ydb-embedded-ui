import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {
    getCpuColumn,
    getHostColumn,
    getLoadAverageColumn,
    getNodeIdColumn,
    getPileNameColumn,
    getRAMColumn,
    getUptimeColumn,
} from '../../../components/nodesColumns/columns';
import {NODES_COLUMNS_IDS} from '../../../components/nodesColumns/constants';
import type {GetNodesColumnsParams, NodesColumn} from '../../../components/nodesColumns/types';
import {useBridgeModeEnabled} from '../../../store/reducers/capabilities/hooks';
import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAdditionalNodesProps} from '../../../utils/hooks/useAdditionalNodesProps';

const VERSIONS_COLUMNS_WIDTH_LS_KEY = 'versionsTableColumnsWidth';

function getColumns(params: GetNodesColumnsParams): NodesColumn[] {
    return [
        getNodeIdColumn(),
        getHostColumn(params),
        getPileNameColumn(),
        getUptimeColumn(),
        getRAMColumn(),
        getCpuColumn(),
        getLoadAverageColumn(),
    ];
}

interface NodesTableProps {
    nodes: PreparedStorageNode[];
}

export const NodesTable = ({nodes}: NodesTableProps) => {
    const additionalNodesProps = useAdditionalNodesProps();
    const bridgeModeEnabled = useBridgeModeEnabled();

    const allColumns = getColumns({getNodeRef: additionalNodesProps?.getNodeRef});
    const columns = bridgeModeEnabled
        ? allColumns
        : allColumns.filter((c) => c.name !== NODES_COLUMNS_IDS.PileName);

    return (
        <ResizeableDataTable
            columnsWidthLSKey={VERSIONS_COLUMNS_WIDTH_LS_KEY}
            data={nodes}
            columns={columns}
            settings={DEFAULT_TABLE_SETTINGS}
        />
    );
};
