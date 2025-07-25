import {
    getClockSkewColumn,
    getDataCenterColumn,
    getNetworkHostColumn,
    getNodeIdColumn,
    getPingTimeColumn,
    getRackColumn,
    getUptimeColumn,
} from '../../../../../components/nodesColumns/columns';
import {isSortableNodesColumn} from '../../../../../components/nodesColumns/constants';
import type {GetNodesColumnsParams} from '../../../../../components/nodesColumns/types';
import type {NodesPreparedEntity} from '../../../../../store/reducers/nodes/types';
import type {Column} from '../../../../../utils/tableUtils/types';

export function getTopNodesByPingColumns(params: GetNodesColumnsParams) {
    const columns: Column<NodesPreparedEntity>[] = [
        getNodeIdColumn(),
        getNetworkHostColumn(params),
        getDataCenterColumn(),
        getRackColumn(),
        getUptimeColumn(),
        getPingTimeColumn(),
    ];

    const fieldsRequired = [
        'NodeId',
        'Host',
        'DataCenter',
        'Rack',
        'UptimeSeconds',
        'PingTimeUs',
        'PingTimeMinUs',
        'PingTimeMaxUs',
    ];

    return [
        columns.map((column) => ({
            ...column,
            sortable: isSortableNodesColumn(column.name),
        })),
        fieldsRequired,
    ] as const;
}

export function getTopNodesBySkewColumns(params: GetNodesColumnsParams) {
    const columns: Column<NodesPreparedEntity>[] = [
        getNodeIdColumn(),
        getNetworkHostColumn(params),
        getDataCenterColumn(),
        getRackColumn(),
        getUptimeColumn(),
        getClockSkewColumn(),
    ];

    const fieldsRequired = [
        'NodeId',
        'Host',
        'DataCenter',
        'Rack',
        'UptimeSeconds',
        'ClockSkewUs',
        'ClockSkewMinUs',
        'ClockSkewMaxUs',
    ];

    return [
        columns.map((column) => ({
            ...column,
            sortable: isSortableNodesColumn(column.name),
        })),
        fieldsRequired,
    ] as const;
}
