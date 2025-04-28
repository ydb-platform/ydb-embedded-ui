import DataTable from '@gravity-ui/react-data-table';

import {
    getCpuColumn,
    getDataCenterColumn,
    getDiskSpaceUsageColumn,
    getHostColumn,
    getMemoryColumn,
    getMissingDisksColumn,
    getNodeIdColumn,
    getNodeNameColumn,
    getPoolsColumn,
    getRAMColumn,
    getRackColumn,
    getUptimeColumn,
    getVersionColumn,
} from '../../../../components/nodesColumns/columns';
import {
    NODES_COLUMNS_IDS,
    NODES_COLUMNS_TITLES,
    isSortableNodesColumn,
} from '../../../../components/nodesColumns/constants';
import type {PreparedStorageNode} from '../../../../store/reducers/storage/types';
import {cn} from '../../../../utils/cn';
import {PDisk} from '../../PDisk/PDisk';

import type {
    GetStorageNodesColumnsParams,
    StorageNodesColumn,
    StorageNodesColumnsSettings,
} from './types';

import './StorageNodesColumns.scss';

const b = cn('ydb-storage-nodes-columns');

const getPDisksColumn = ({
    viewContext,
    columnsSettings,
}: GetStorageNodesColumnsParams & {
    columnsSettings?: StorageNodesColumnsSettings;
}): StorageNodesColumn => {
    return {
        name: NODES_COLUMNS_IDS.PDisks,
        header: NODES_COLUMNS_TITLES.PDisks,
        className: b('pdisks-column'),
        width: columnsSettings?.pDiskContainerWidth,
        render: ({row}) => {
            return (
                <div className={b('pdisks-wrapper')}>
                    {row.PDisks?.map((pDisk) => {
                        const vDisks = row.VDisks?.filter(
                            (vdisk) => vdisk.PDiskId === pDisk.PDiskId,
                        );

                        return (
                            <div className={b('pdisks-item')} key={pDisk.PDiskId}>
                                <PDisk
                                    data={pDisk}
                                    vDisks={vDisks}
                                    viewContext={viewContext}
                                    width={columnsSettings?.pDiskWidth}
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
};

export const getStorageNodesColumns = ({
    database,
    additionalNodesProps,
    viewContext,
    columnsSettings,
}: GetStorageNodesColumnsParams): StorageNodesColumn[] => {
    const getNodeRef = additionalNodesProps?.getNodeRef;

    const columns = [
        getNodeIdColumn<PreparedStorageNode>(),
        getHostColumn<PreparedStorageNode>({getNodeRef, database}),
        getNodeNameColumn<PreparedStorageNode>(),
        getDataCenterColumn<PreparedStorageNode>(),
        getRackColumn<PreparedStorageNode>(),
        getUptimeColumn<PreparedStorageNode>(),
        getCpuColumn<PreparedStorageNode>(),
        getPoolsColumn<PreparedStorageNode>(),
        getRAMColumn<PreparedStorageNode>(),
        getMemoryColumn<PreparedStorageNode>(),
        getDiskSpaceUsageColumn<PreparedStorageNode>(),
        getVersionColumn<PreparedStorageNode>(),
        getMissingDisksColumn<PreparedStorageNode>(),
        getPDisksColumn({viewContext, columnsSettings}),
    ];

    const sortableColumns = columns.map((column) => ({
        ...column,
        sortable: isSortableNodesColumn(column.name),
    }));

    return sortableColumns;
};
