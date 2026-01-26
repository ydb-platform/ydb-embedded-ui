import {
    getCpuColumn,
    getDataCenterColumn,
    getDatabaseColumn,
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
import type {GetNodesColumnsParams, NodesColumn} from '../../../components/nodesColumns/types';
import {getPDisksColumn} from '../../Storage/PaginatedStorageNodesTable/columns/columns';

export function getNodesColumns(params: GetNodesColumnsParams): NodesColumn[] {
    const columns: NodesColumn[] = [
        getNodeIdColumn(),
        getHostColumn(params),
        getNodeNameColumn(),
        getDatabaseColumn(),
        getDataCenterColumn(),
        getPileNameColumn(),
        getRackColumn(),
        getUptimeColumn(),
        getCpuColumn(),
        getPoolsColumn(),
        getRAMColumn(),
        getMemoryColumn(),
        getLoadAverageColumn(),
        getVersionColumn(),
        getPDisksColumn(params),
        getTabletsColumn(params),
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesColumn(column.name)};
    });
}
