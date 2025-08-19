import DataTable from '@gravity-ui/react-data-table';

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
import {
    NODES_COLUMNS_IDS,
    NODES_COLUMNS_TITLES,
    isSortableNodesColumn,
} from '../../../components/nodesColumns/constants';
import type {GetNodesColumnsParams} from '../../../components/nodesColumns/types';
import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import type {TPDiskStateInfo} from '../../../types/api/pdisk';
import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import {cn} from '../../../utils/cn';
import {
    prepareWhiteboardPDiskData,
    prepareWhiteboardVDiskData,
} from '../../../utils/disks/prepareDisks';
import type {Column} from '../../../utils/tableUtils/types';
import {PDisk} from '../../Storage/PDisk/PDisk';

const b = cn('ydb-nodes-columns');

// Extended type for nodes that may have disk information
type NodeWithDisks = NodesPreparedEntity & {
    PDisks?: TPDiskStateInfo[];
    VDisks?: TVDiskStateInfo[];
};

function getPDisksColumn(): Column<NodesPreparedEntity> {
    return {
        name: NODES_COLUMNS_IDS.PDisks,
        header: NODES_COLUMNS_TITLES.PDisks,
        className: b('pdisks-column'),
        render: ({row}) => {
            const nodeWithDisks = row as NodeWithDisks;
            return (
                <div className={b('pdisks-wrapper')}>
                    {nodeWithDisks.PDisks?.map((pDisk) => {
                        const preparedPDisk = prepareWhiteboardPDiskData(pDisk);
                        const vDisks = nodeWithDisks.VDisks?.filter(
                            (vdisk) => vdisk.PDiskId === pDisk.PDiskId,
                        );
                        const preparedVDisks = vDisks?.map(prepareWhiteboardVDiskData);

                        return (
                            <div className={b('pdisks-item')} key={pDisk.PDiskId}>
                                <PDisk
                                    data={preparedPDisk}
                                    vDisks={preparedVDisks}
                                    viewContext={{}}
                                />
                            </div>
                        );
                    })}
                </div>
            );
        },
        align: DataTable.CENTER,
        sortable: false,
        resizeable: false,
    };
}

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
        getPDisksColumn(),
        getTabletsColumn<NodesPreparedEntity>(params),
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesColumn(column.name)};
    });
}
