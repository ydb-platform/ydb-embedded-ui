import {
    getClockSkewColumn,
    getConnectionsColumn,
    getCpuColumn,
    getDataCenterColumn,
    getHostColumn,
    getNetworkUtilizationColumn,
    getNodeIdColumn,
    getPingTimeColumn,
    getPoolsColumn,
    getRackColumn,
    getReceiveThroughputColumn,
    getSendThroughputColumn,
    getUptimeColumn,
} from '../../../../../components/nodesColumns/columns';
import {isSortableNodesColumn} from '../../../../../components/nodesColumns/constants';
import type {GetNodesColumnsParams} from '../../../../../components/nodesColumns/types';
import type {NodesPreparedEntity} from '../../../../../store/reducers/nodes/types';
import type {Column} from '../../../../../utils/tableUtils/types';

export function getNetworkTableNodesColumns(
    params: GetNodesColumnsParams,
): Column<NodesPreparedEntity>[] {
    const columns = [
        getNodeIdColumn<NodesPreparedEntity>(),
        getHostColumn<NodesPreparedEntity>(params, {statusForIcon: 'ConnectStatus'}),
        getDataCenterColumn<NodesPreparedEntity>(),
        getRackColumn<NodesPreparedEntity>(),
        getUptimeColumn<NodesPreparedEntity>(),
        getCpuColumn<NodesPreparedEntity>(),
        getPoolsColumn<NodesPreparedEntity>(),
        getConnectionsColumn<NodesPreparedEntity>(),
        getNetworkUtilizationColumn<NodesPreparedEntity>(),
        getSendThroughputColumn<NodesPreparedEntity>(),
        getReceiveThroughputColumn<NodesPreparedEntity>(),
        getPingTimeColumn<NodesPreparedEntity>(),
        getClockSkewColumn<NodesPreparedEntity>(),
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesColumn(column.name)};
    });
}
