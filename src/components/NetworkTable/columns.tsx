import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {Column} from '../../utils/tableUtils/types';
import {
    getClockSkewColumn,
    getConnectionsColumn,
    getCpuColumn,
    getDataCenterColumn,
    getNetworkHostColumn,
    getNetworkUtilizationColumn,
    getNodeIdColumn,
    getPingTimeColumn,
    getPoolsColumn,
    getRackColumn,
    getReceiveThroughputColumn,
    getSendThroughputColumn,
    getUptimeColumn,
} from '../nodesColumns/columns';
import {isSortableNodesColumn} from '../nodesColumns/constants';
import type {GetNodesColumnsParams} from '../nodesColumns/types';

export function getNetworkTableNodesColumns(params: GetNodesColumnsParams) {
    const columns: Column<NodesPreparedEntity>[] = [
        getNodeIdColumn(),
        getNetworkHostColumn(params),
        getDataCenterColumn(),
        getRackColumn(),
        getUptimeColumn(),
        getCpuColumn(),
        getPoolsColumn(),
        getConnectionsColumn(),
        getNetworkUtilizationColumn(),
        getSendThroughputColumn(),
        getReceiveThroughputColumn(),
        getPingTimeColumn(),
        getClockSkewColumn(),
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesColumn(column.name)};
    });
}
