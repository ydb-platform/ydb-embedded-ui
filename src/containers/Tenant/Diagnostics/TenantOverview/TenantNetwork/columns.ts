import {
    getClockSkewColumn,
    getNetworkHostColumn,
    getNodeIdColumn,
    getPingTimeColumn,
    getUptimeColumn,
} from '../../../../../components/nodesColumns/columns';
import {
    NODES_COLUMNS_TO_DATA_FIELDS,
    isSortableNodesColumn,
} from '../../../../../components/nodesColumns/constants';
import type {GetNodesColumnsParams} from '../../../../../components/nodesColumns/types';
import type {NodesPreparedEntity} from '../../../../../store/reducers/nodes/types';
import {getRequiredDataFields} from '../../../../../utils/tableUtils/getRequiredDataFields';
import type {Column} from '../../../../../utils/tableUtils/types';

export function getTopNodesByPingColumns(params: GetNodesColumnsParams) {
    const columns: Column<NodesPreparedEntity>[] = [
        getNodeIdColumn(),
        getNetworkHostColumn(params),
        getUptimeColumn(),
        getPingTimeColumn(),
    ];

    const columnsIds = columns.map((column) => column.name);
    const fieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

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
        getUptimeColumn(),
        getClockSkewColumn(),
    ];

    const columnsIds = columns.map((column) => column.name);
    const fieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

    return [
        columns.map((column) => ({
            ...column,
            sortable: isSortableNodesColumn(column.name),
        })),
        fieldsRequired,
    ] as const;
}
