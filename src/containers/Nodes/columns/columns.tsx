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
import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import type {Column} from '../../../utils/tableUtils/types';
import {getPDisksColumn} from '../../Storage/PaginatedStorageNodesTable/columns/columns';

export function getNodesColumns(params: GetNodesColumnsParams): Column<PreparedStorageNode>[] {
    const columns = [
        getNodeIdColumn<PreparedStorageNode>(),
        getHostColumn<PreparedStorageNode>(params),
        getNodeNameColumn<PreparedStorageNode>(),
        getDataCenterColumn<PreparedStorageNode>(),
        getPileNameColumn<PreparedStorageNode>(),
        getRackColumn<PreparedStorageNode>(),
        getUptimeColumn<PreparedStorageNode>(),
        getCpuColumn<PreparedStorageNode>(),
        getPoolsColumn<PreparedStorageNode>(),
        getRAMColumn<PreparedStorageNode>(),
        getMemoryColumn<PreparedStorageNode>(),
        getLoadAverageColumn<PreparedStorageNode>(),
        getVersionColumn<PreparedStorageNode>(),
        getPDisksColumn({viewContext: {}, columnsSettings: undefined}),
        getTabletsColumn<PreparedStorageNode>(params),
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesColumn(column.name)};
    });
}
