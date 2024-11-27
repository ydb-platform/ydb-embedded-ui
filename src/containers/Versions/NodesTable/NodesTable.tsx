import type {Column} from '@gravity-ui/react-data-table';

import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {
    getCpuColumn,
    getHostColumn,
    getLoadAverageColumn,
    getNodeIdColumn,
    getRAMColumn,
    getUptimeColumn,
} from '../../../components/nodesColumns/columns';
import type {GetNodesColumnsParams} from '../../../components/nodesColumns/types';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAdditionalNodeProps} from '../../AppWithClusters/useClusterData';

const VERSIONS_COLUMNS_WIDTH_LS_KEY = 'versionsTableColumnsWidth';

function getColumns(params: GetNodesColumnsParams): Column<NodesPreparedEntity>[] {
    return [
        getNodeIdColumn(),
        getHostColumn(params),
        getUptimeColumn(),
        getRAMColumn(),
        getCpuColumn(),
        getLoadAverageColumn(),
    ];
}

interface NodesTableProps {
    nodes: NodesPreparedEntity[];
}

export const NodesTable = ({nodes}: NodesTableProps) => {
    const {balancer} = useClusterBaseInfo();
    const {additionalNodesProps} = useAdditionalNodeProps({balancer});

    const columns = getColumns({getNodeRef: additionalNodesProps.getNodeRef});

    return (
        <ResizeableDataTable
            columnsWidthLSKey={VERSIONS_COLUMNS_WIDTH_LS_KEY}
            data={nodes}
            columns={columns}
            settings={DEFAULT_TABLE_SETTINGS}
        />
    );
};
