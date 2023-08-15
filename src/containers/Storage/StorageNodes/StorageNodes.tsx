import cn from 'bem-cn-lite';

import DataTable, {Column, Settings, SortOrder} from '@gravity-ui/react-data-table';

import type {ValueOf} from '../../../types/common';
import type {PreparedStorageNode, VisibleEntities} from '../../../store/reducers/storage/types';
import type {HandleSort} from '../../../utils/hooks/useTableSort';

import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import {
    AdditionalNodesInfo,
    isSortableNodesProperty,
    isUnavailableNode,
    NodesUptimeFilterValues,
} from '../../../utils/nodes';

import {NodeHostWrapper} from '../../../components/NodeHostWrapper/NodeHostWrapper';

import {EmptyFilter} from '../EmptyFilter/EmptyFilter';
import {PDisk} from '../PDisk';

import i18n from './i18n';
import './StorageNodes.scss';

const TableColumnsIds = {
    NodeId: 'NodeId',
    Host: 'Host',
    DC: 'DC',
    Rack: 'Rack',
    Uptime: 'Uptime',
    PDisks: 'PDisks',
    Missing: 'Missing',
} as const;

type TableColumnId = ValueOf<typeof TableColumnsIds>;

interface StorageNodesProps {
    data: PreparedStorageNode[];
    tableSettings: Settings;
    visibleEntities: VisibleEntities;
    nodesUptimeFilter: keyof typeof NodesUptimeFilterValues;
    onShowAll?: VoidFunction;
    additionalNodesInfo?: AdditionalNodesInfo;
    sort?: SortOrder;
    handleSort?: HandleSort;
}

const tableColumnsNames: Record<TableColumnId, string> = {
    NodeId: 'Node ID',
    Host: 'Host',
    DC: 'DC',
    Rack: 'Rack',
    Uptime: 'Uptime',
    PDisks: 'PDisks',
    Missing: 'Missing',
};

const b = cn('global-storage-nodes');

export function StorageNodes({
    data,
    tableSettings,
    visibleEntities,
    onShowAll,
    nodesUptimeFilter,
    additionalNodesInfo,
    sort,
    handleSort,
}: StorageNodesProps) {
    const getNodeRef = additionalNodesInfo?.getNodeRef;

    const rawColumns: Column<PreparedStorageNode>[] = [
        {
            name: TableColumnsIds.NodeId,
            header: tableColumnsNames[TableColumnsIds.NodeId],
            width: 100,
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.Host,
            header: tableColumnsNames[TableColumnsIds.Host],
            width: 350,
            render: ({row}) => {
                return <NodeHostWrapper node={row} getNodeRef={getNodeRef} />;
            },
            align: DataTable.LEFT,
        },
        {
            name: TableColumnsIds.DC,
            header: tableColumnsNames[TableColumnsIds.DC],
            render: ({row}) => row.DataCenter || '—',
            align: DataTable.LEFT,
        },
        {
            name: TableColumnsIds.Rack,
            header: tableColumnsNames[TableColumnsIds.Rack],
            render: ({row}) => row.Rack || '—',
            align: DataTable.LEFT,
        },
        {
            name: TableColumnsIds.Uptime,
            header: tableColumnsNames[TableColumnsIds.Uptime],
            width: 130,
            sortAccessor: ({StartTime}) => (StartTime ? -StartTime : 0),
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.Missing,
            header: tableColumnsNames[TableColumnsIds.Missing],
            width: 100,
            align: DataTable.CENTER,
            defaultOrder: DataTable.DESCENDING,
        },
        {
            name: TableColumnsIds.PDisks,
            className: b('pdisks-column'),
            header: tableColumnsNames[TableColumnsIds.PDisks],
            render: ({row}) => (
                <div className={b('pdisks-wrapper')}>
                    {row.PDisks?.map((pDisk) => (
                        <div className={b('pdisks-item')} key={pDisk.PDiskId}>
                            <PDisk data={pDisk} nodeId={row.NodeId} />
                        </div>
                    ))}
                </div>
            ),
            align: DataTable.CENTER,
            sortable: false,
            width: 900,
        },
    ];

    let columns = rawColumns.map((column) => ({
        ...column,
        sortable: isSortableNodesProperty(column.name),
    }));

    if (visibleEntities !== VISIBLE_ENTITIES.missing) {
        columns = columns.filter((col) => col.name !== TableColumnsIds.Missing);
    }

    if (!data.length) {
        let message;

        if (visibleEntities === VISIBLE_ENTITIES.space) {
            message = i18n('empty.out_of_space');
        }

        if (visibleEntities === VISIBLE_ENTITIES.missing) {
            message = i18n('empty.degraded');
        }

        if (nodesUptimeFilter === NodesUptimeFilterValues.SmallUptime) {
            message = i18n('empty.small_uptime');
        }

        if (
            visibleEntities !== VISIBLE_ENTITIES.all &&
            nodesUptimeFilter !== NodesUptimeFilterValues.All
        ) {
            message = i18n('empty.several_filters');
        }

        if (message) {
            return <EmptyFilter title={message} showAll={i18n('show_all')} onShowAll={onShowAll} />;
        }
    }

    return data ? (
        <DataTable
            key={visibleEntities as string}
            theme="yandex-cloud"
            data={data}
            columns={columns}
            settings={{
                ...tableSettings,
                dynamicRenderType: 'variable',
            }}
            emptyDataMessage={i18n('empty.default')}
            rowClassName={(row) => b('node', {unavailable: isUnavailableNode(row)})}
            sortOrder={sort}
            onSort={handleSort}
        />
    ) : null;
}
