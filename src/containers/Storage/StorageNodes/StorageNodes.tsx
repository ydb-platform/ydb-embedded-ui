import _ from 'lodash';
import cn from 'bem-cn-lite';

import DataTable, {Column, Settings, SortOrder} from '@gravity-ui/react-data-table';
import {Popover, PopoverBehavior} from '@gravity-ui/uikit';

import {VisibleEntities} from '../../../store/reducers/storage';
import {NodesUptimeFilterValues} from '../../../utils/nodes';

import {EmptyFilter} from '../EmptyFilter/EmptyFilter';
import {PDisk} from '../PDisk';

import i18n from './i18n';
import './StorageNodes.scss';

enum TableColumnsIds {
    NodeId = 'NodeId',
    FQDN = 'FQDN',
    DataCenter = 'DataCenter',
    Rack = 'Rack',
    uptime = 'uptime',
    PDisks = 'PDisks',
    Missing = 'Missing',
}

type TableColumnsIdsKeys = keyof typeof TableColumnsIds;
type TableColumnsIdsValues = typeof TableColumnsIds[TableColumnsIdsKeys];

interface StorageNodesProps {
    data: any;
    nodes: any;
    tableSettings: Settings;
    visibleEntities: keyof typeof VisibleEntities;
    nodesUptimeFilter: keyof typeof NodesUptimeFilterValues;
    onShowAll?: VoidFunction;
}

const tableColumnsNames: Record<TableColumnsIdsValues, string> = {
    NodeId: 'Node ID',
    FQDN: 'FQDN',
    DataCenter: 'DC',
    Rack: 'Rack',
    uptime: 'Uptime',
    PDisks: 'PDisks',
    Missing: 'Missing',
};

const b = cn('global-storage-nodes');

function setSortOrder(visibleEntities: keyof typeof VisibleEntities): SortOrder | undefined {
    switch (visibleEntities) {
        case VisibleEntities.All: {
            return {
                columnId: TableColumnsIds.NodeId,
                order: DataTable.ASCENDING,
            };
        }
        case VisibleEntities.Missing: {
            return {
                columnId: TableColumnsIds.Missing,
                order: DataTable.DESCENDING,
            };
        }
        default: {
            return undefined;
        }
    }
}

function StorageNodes({
    data,
    tableSettings,
    visibleEntities,
    onShowAll,
    nodesUptimeFilter,
}: StorageNodesProps) {
    const allColumns: Column<any>[] = [
        {
            name: TableColumnsIds.NodeId,
            header: tableColumnsNames[TableColumnsIds.NodeId],
            width: 100,
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.FQDN,
            header: tableColumnsNames[TableColumnsIds.FQDN],
            width: 350,
            render: ({value}) => {
                return (
                    <div className={b('fqdn-wrapper')}>
                        <Popover
                            content={value as string}
                            placement={['right']}
                            behavior={PopoverBehavior.Immediate}
                        >
                            <span className={b('fqdn')}>{value as string}</span>
                        </Popover>
                    </div>
                );
            },
            align: DataTable.LEFT,
        },
        {
            name: TableColumnsIds.DataCenter,
            header: tableColumnsNames[TableColumnsIds.DataCenter],
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
            name: TableColumnsIds.uptime,
            header: tableColumnsNames[TableColumnsIds.uptime],
            width: 130,
            sortAccessor: ({StartTime}) => -StartTime,
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
            render: ({value, row}) => (
                <div className={b('pdisks-wrapper')}>
                    {_.map(value as any, (el) => (
                        <div className={b('pdisks-item')} key={el.PDiskId}>
                            <PDisk data={el} nodeId={row.NodeId} />
                        </div>
                    ))}
                </div>
            ),
            align: DataTable.CENTER,
            sortable: false,
            width: 900,
        },
    ];

    let columns = allColumns;

    if (visibleEntities === VisibleEntities.Space) {
        columns = allColumns.filter((col) => col.name !== TableColumnsIds.Missing);
    }

    if (!data.length) {
        let message;

        if (visibleEntities === VisibleEntities.Space) {
            message = i18n('empty.out_of_space');
        }

        if (visibleEntities === VisibleEntities.Missing) {
            message = i18n('empty.degraded');
        }

        if (nodesUptimeFilter === NodesUptimeFilterValues.SmallUptime) {
            message = i18n('empty.small_uptime');
        }

        if (
            visibleEntities !== VisibleEntities.All &&
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
            initialSortOrder={setSortOrder(visibleEntities)}
            emptyDataMessage={i18n('empty.default')}
        />
    ) : null;
}

export default StorageNodes;
