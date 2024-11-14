import {
    getCpuColumn,
    getDataCenterColumn,
    getHostColumn,
    getLoadAverageColumn,
    getMemoryColumn,
    getNodeIdColumn,
    getNodeNameColumn,
    getPoolsColumn,
    getRAMColumn,
    getRackColumn,
    getTabletsColumn,
    getUptimeColumn,
    getVersionColumn,
} from '../../../components/nodesColumns/columns';
import {isSortableNodesColumn} from '../../../components/nodesColumns/constants';
import type {GetNodesColumnsParams} from '../../../components/nodesColumns/types';
import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import type {Column} from '../../../utils/tableUtils/types';

export function getNodesColumns(params: GetNodesColumnsParams): Column<NodesPreparedEntity>[] {
    const columns = [
        getNodeIdColumn<NodesPreparedEntity>(),
        getHostColumn<NodesPreparedEntity>(params),
        getNodeNameColumn<NodesPreparedEntity>(),
        getDataCenterColumn<NodesPreparedEntity>(),
        getRackColumn<NodesPreparedEntity>(),
        getVersionColumn<NodesPreparedEntity>(),
        getUptimeColumn<NodesPreparedEntity>(),
        getMemoryColumn<NodesPreparedEntity>(),
        getRAMColumn<NodesPreparedEntity>(),
        getPoolsColumn<NodesPreparedEntity>(),
        getCpuColumn<NodesPreparedEntity>(),
        getLoadAverageColumn<NodesPreparedEntity>(),
        getTabletsColumn<NodesPreparedEntity>(params),
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesColumn(column.name)};
    });
}
