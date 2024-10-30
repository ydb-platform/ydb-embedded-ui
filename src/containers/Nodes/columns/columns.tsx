import {
    getCpuColumn,
    getDataCenterColumn,
    getHostColumn,
    getLoadAverageColumn,
    getMemoryColumn,
    getNodeIdColumn,
    getNodeNameColumn,
    getRAMColumn,
    getRackColumn,
    getTabletsColumn,
    getTotalCpuColumn,
    getUptimeColumn,
    getVersionColumn,
} from '../../../components/nodesColumns/columns';
import type {GetNodesColumnsParams} from '../../../components/nodesColumns/types';
import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import {isSortableNodesProperty} from '../../../utils/nodes';
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
        getCpuColumn<NodesPreparedEntity>(),
        getTotalCpuColumn<NodesPreparedEntity>(),
        getLoadAverageColumn<NodesPreparedEntity>(),
        getTabletsColumn<NodesPreparedEntity>(params),
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesProperty(column.name)};
    });
}
