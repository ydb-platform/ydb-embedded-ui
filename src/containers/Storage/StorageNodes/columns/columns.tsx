import DataTable from '@gravity-ui/react-data-table';

import {
    getCpuColumn,
    getDataCenterColumn,
    getHostColumn,
    getMemoryColumn,
    getMissingDisksColumn,
    getNodeIdColumn,
    getNodeNameColumn,
    getRackColumn,
    getUptimeColumn,
    getVersionColumn,
} from '../../../../components/nodesColumns/columns';
import type {PreparedStorageNode} from '../../../../store/reducers/storage/types';
import {cn} from '../../../../utils/cn';
import {isSortableNodesProperty} from '../../../../utils/nodes';
import {PDisk} from '../../PDisk/PDisk';

import {STORAGE_NODES_COLUMNS_IDS, STORAGE_NODES_COLUMNS_TITLES} from './constants';
import type {GetStorageNodesColumnsParams, StorageNodesColumn} from './types';

import './StorageNodesColumns.scss';

const b = cn('ydb-storage-nodes-columns');

const getPDisksColumn = ({viewContext}: GetStorageNodesColumnsParams): StorageNodesColumn => {
    return {
        name: STORAGE_NODES_COLUMNS_IDS.PDisks,
        header: STORAGE_NODES_COLUMNS_TITLES.PDisks,
        className: b('pdisks-column'),
        render: ({row}) => {
            return (
                <div className={b('pdisks-wrapper')}>
                    {row.PDisks?.map((pDisk) => {
                        const vDisks = row.VDisks?.filter(
                            (vdisk) => vdisk.PDiskId === pDisk.PDiskId,
                        );

                        return (
                            <div className={b('pdisks-item')} key={pDisk.PDiskId}>
                                <PDisk data={pDisk} vDisks={vDisks} viewContext={viewContext} />
                            </div>
                        );
                    })}
                </div>
            );
        },
        align: DataTable.CENTER,
        sortable: false,
        width: 900,
        resizeable: false,
    };
};

export const getStorageNodesColumns = ({
    database,
    additionalNodesProps,
    viewContext,
}: GetStorageNodesColumnsParams): StorageNodesColumn[] => {
    const getNodeRef = additionalNodesProps?.getNodeRef;

    const columns = [
        getNodeIdColumn<PreparedStorageNode>(),
        getNodeNameColumn<PreparedStorageNode>(),
        getHostColumn<PreparedStorageNode>({getNodeRef, database}),
        getDataCenterColumn<PreparedStorageNode>(),
        getRackColumn<PreparedStorageNode>(),
        getVersionColumn<PreparedStorageNode>(),
        getMemoryColumn<PreparedStorageNode>(),
        getCpuColumn<PreparedStorageNode>(),
        getUptimeColumn<PreparedStorageNode>(),
        getMissingDisksColumn<PreparedStorageNode>(),
        getPDisksColumn({viewContext}),
    ];

    const sortableColumns = columns.map((column) => ({
        ...column,
        sortable: isSortableNodesProperty(column.name),
    }));

    return sortableColumns;
};
