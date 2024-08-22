import DataTable from '@gravity-ui/react-data-table';
import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';

import {NodeHostWrapper} from '../../../components/NodeHostWrapper/NodeHostWrapper';
import type {Column as PaginatedTableColumn} from '../../../components/PaginatedTable';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {PreparedStorageNode, VisibleEntities} from '../../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../../types/additionalProps';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {isSortableNodesProperty} from '../../../utils/nodes';
import {PDisk} from '../PDisk/PDisk';

import {b} from './shared';

export const STORAGE_NODES_COLUMNS_WIDTH_LS_KEY = 'storageNodesColumnsWidth';

export const STORAGE_NODES_COLUMNS_IDS = {
    NodeId: 'NodeId',
    Host: 'Host',
    DC: 'DC',
    Rack: 'Rack',
    Uptime: 'Uptime',
    PDisks: 'PDisks',
    Missing: 'Missing',
} as const;

type StorageGroupsColumn = PaginatedTableColumn<PreparedStorageNode> &
    DataTableColumn<PreparedStorageNode>;

const getStorageNodesColumns = (additionalNodesProps: AdditionalNodesProps | undefined) => {
    const getNodeRef = additionalNodesProps?.getNodeRef;
    const database = additionalNodesProps?.database;

    const columns: StorageGroupsColumn[] = [
        {
            name: STORAGE_NODES_COLUMNS_IDS.NodeId,
            header: 'Node ID',
            width: 100,
            align: DataTable.RIGHT,
            render: ({row}) => row.NodeId,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.Host,
            header: 'Host',
            width: 350,
            render: ({row}) => {
                return <NodeHostWrapper node={row} getNodeRef={getNodeRef} database={database} />;
            },
            align: DataTable.LEFT,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.DC,
            header: 'DC',
            width: 100,
            render: ({row}) => row.DC || EMPTY_DATA_PLACEHOLDER,
            align: DataTable.LEFT,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.Rack,
            header: 'Rack',
            width: 100,
            render: ({row}) => row.Rack || '—',
            align: DataTable.LEFT,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.Uptime,
            header: 'Uptime',
            width: 130,
            sortAccessor: ({StartTime}) => (StartTime ? -StartTime : 0),
            align: DataTable.RIGHT,
            render: ({row}) => row.Uptime,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.Missing,
            header: 'Missing',
            width: 100,
            align: DataTable.CENTER,
            defaultOrder: DataTable.DESCENDING,
            render: ({row}) => row.Missing,
        },
        {
            name: STORAGE_NODES_COLUMNS_IDS.PDisks,
            className: b('pdisks-column'),
            header: 'PDisks',
            render: ({row}) => {
                return (
                    <div className={b('pdisks-wrapper')}>
                        {row.PDisks?.map((pDisk) => {
                            const vDisks = row.VDisks?.filter(
                                (vdisk) => vdisk.PDiskId === pDisk.PDiskId,
                            );

                            return (
                                <div className={b('pdisks-item')} key={pDisk.PDiskId}>
                                    <PDisk data={pDisk} nodeId={row.NodeId} vDisks={vDisks} />
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

export const getPreparedStorageNodesColumns = (
    additionalNodesProps: AdditionalNodesProps | undefined,
    visibleEntities: VisibleEntities,
) => {
    const rawColumns = getStorageNodesColumns(additionalNodesProps);

    const sortableColumns = rawColumns.map((column) => ({
        ...column,
        sortable: isSortableNodesProperty(column.name),
    }));

    if (visibleEntities !== VISIBLE_ENTITIES.missing) {
        return sortableColumns.filter((col) => col.name !== STORAGE_NODES_COLUMNS_IDS.Missing);
    }

    return sortableColumns;
};
