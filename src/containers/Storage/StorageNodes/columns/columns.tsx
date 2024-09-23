import DataTable from '@gravity-ui/react-data-table';

import {NodeHostWrapper} from '../../../../components/NodeHostWrapper/NodeHostWrapper';
import type {AdditionalNodesProps} from '../../../../types/additionalProps';
import {cn} from '../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {isSortableNodesProperty} from '../../../../utils/nodes';
import {PDisk} from '../../PDisk/PDisk';

import {STORAGE_NODES_COLUMNS_IDS, STORAGE_NODES_COLUMNS_TITLES} from './constants';
import type {GetStorageNodesColumnsParams, StorageNodesColumn} from './types';

import './StorageNodesColumns.scss';

const b = cn('ydb-storage-nodes-columns');

const getStorageNodesColumns = (
    additionalNodesProps: AdditionalNodesProps | undefined,
    database?: string,
) => {
    const getNodeRef = additionalNodesProps?.getNodeRef;

    const columns: StorageNodesColumn[] = [
        {
            name: STORAGE_NODES_COLUMNS_IDS.NodeId,
            header: STORAGE_NODES_COLUMNS_TITLES.NodeId,
            width: 100,
            align: DataTable.RIGHT,
            render: ({row}) => row.NodeId,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.Host,
            header: STORAGE_NODES_COLUMNS_TITLES.Host,
            width: 350,
            render: ({row}) => {
                return <NodeHostWrapper node={row} getNodeRef={getNodeRef} database={database} />;
            },
            align: DataTable.LEFT,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.DC,
            header: STORAGE_NODES_COLUMNS_TITLES.DC,
            width: 100,
            render: ({row}) => row.DC || EMPTY_DATA_PLACEHOLDER,
            align: DataTable.LEFT,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.Rack,
            header: STORAGE_NODES_COLUMNS_TITLES.Rack,
            width: 100,
            render: ({row}) => row.Rack || '—',
            align: DataTable.LEFT,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.Uptime,
            header: STORAGE_NODES_COLUMNS_TITLES.Uptime,
            width: 130,
            sortAccessor: ({StartTime}) => (StartTime ? -StartTime : 0),
            align: DataTable.RIGHT,
            render: ({row}) => row.Uptime,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.Missing,
            header: STORAGE_NODES_COLUMNS_TITLES.Missing,
            width: 100,
            align: DataTable.CENTER,
            defaultOrder: DataTable.DESCENDING,
            render: ({row}) => row.Missing,
        },
        {
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
                                    <PDisk data={pDisk} vDisks={vDisks} />
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
        },
    ];

    return columns;
};

export const getPreparedStorageNodesColumns = ({
    additionalNodesProps,
    database,
}: GetStorageNodesColumnsParams) => {
    const rawColumns = getStorageNodesColumns(additionalNodesProps, database);

    const sortableColumns = rawColumns.map((column) => ({
        ...column,
        sortable: isSortableNodesProperty(column.name),
    }));

    return sortableColumns;
};
