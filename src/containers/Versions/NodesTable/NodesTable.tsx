import type {Column} from '@gravity-ui/react-data-table';

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
import type {GetNodesColumnsParams} from '../../../components/nodesColumns/types';
import {useBridgeModeEnabled} from '../../../store/reducers/capabilities/hooks';
import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAdditionalNodesProps} from '../../../utils/hooks/useAdditionalNodesProps';

const VERSIONS_COLUMNS_WIDTH_LS_KEY = 'versionsTableColumnsWidth';

function getColumns(params: GetNodesColumnsParams): Column<NodesPreparedEntity>[] {
    return [
        getNodeIdColumn<NodesPreparedEntity>(),
        getHostColumn<NodesPreparedEntity>(params),
        getPileNameColumn<NodesPreparedEntity>(),
        getUptimeColumn<NodesPreparedEntity>(),
        getRAMColumn<NodesPreparedEntity>(),
        getCpuColumn<NodesPreparedEntity>(),
        getLoadAverageColumn<NodesPreparedEntity>(),
    ];
}

interface NodesTableProps {
    nodes: NodesPreparedEntity[];
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
