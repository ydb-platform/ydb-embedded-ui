import {
    getCpuColumn,
    getDataCenterColumn,
    getHostColumn,
    getLoadAverageColumn,
    getMemoryColumn,
    getNodeIdColumn,
    getNodeNameColumn,
    getPileNameColumn,
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
        getPileNameColumn<NodesPreparedEntity>(),
        getRackColumn<NodesPreparedEntity>(),
        getUptimeColumn<NodesPreparedEntity>(),
        getCpuColumn<NodesPreparedEntity>(),
        getPoolsColumn<NodesPreparedEntity>(),
        getRAMColumn<NodesPreparedEntity>(),
        getMemoryColumn<NodesPreparedEntity>(),
        getLoadAverageColumn<NodesPreparedEntity>(),
        getVersionColumn<NodesPreparedEntity>(),
        getTabletsColumn<NodesPreparedEntity>(params),
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesColumn(column.name)};
    });
}
