import {
    getClockSkewColumn,
    getNetworkHostColumn,
    getNodeIdColumn,
    getPingTimeColumn,
    getUptimeColumn,
} from '../../../../../components/nodesColumns/columns';
import {NODES_COLUMNS_TO_DATA_FIELDS} from '../../../../../components/nodesColumns/constants';
import type {
    GetNodesColumnsParams,
    NodesColumn,
} from '../../../../../components/nodesColumns/types';
import {getRequiredDataFields} from '../../../../../utils/tableUtils/getRequiredDataFields';

export function getTopNodesByPingColumns(params: GetNodesColumnsParams) {
    const columns: NodesColumn[] = [
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
            sortable: false,
        })),
        fieldsRequired,
    ] as const;
}

export function getTopNodesBySkewColumns(params: GetNodesColumnsParams) {
    const columns: NodesColumn[] = [
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
            sortable: false,
        })),
        fieldsRequired,
    ] as const;
}
