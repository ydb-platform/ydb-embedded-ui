import DataTable, {Column} from '@gravity-ui/react-data-table';
import {Popover} from '@gravity-ui/uikit';

import {PoolsGraph} from '../../components/PoolsGraph/PoolsGraph';
import ProgressViewer from '../../components/ProgressViewer/ProgressViewer';
import {TabletsStatistic} from '../../components/TabletsStatistic';
import {NodeHostWrapper} from '../../components/NodeHostWrapper/NodeHostWrapper';

import {isSortableNodesProperty} from '../../utils/nodes';
import {formatBytesToGigabyte} from '../../utils/index';

import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';

import type {NodeAddress} from '../../types/additionalProps';

const NODES_COLUMNS_IDS = {
    NodeId: 'NodeId',
    Host: 'Host',
    DC: 'DC',
    Rack: 'Rack',
    Version: 'Version',
    Uptime: 'Uptime',
    Memory: 'Memory',
    CPU: 'CPU',
    LoadAverage: 'LoadAverage',
    Tablets: 'Tablets',
};

interface GetNodesColumnsProps {
    tabletsPath?: string;
    getNodeRef?: (node?: NodeAddress) => string | null;
}

export function getNodesColumns({
    tabletsPath,
    getNodeRef,
}: GetNodesColumnsProps): Column<NodesPreparedEntity>[] {
    const columns: Column<NodesPreparedEntity>[] = [
        {
            name: NODES_COLUMNS_IDS.NodeId,
            header: '#',
            width: '80px',
            align: DataTable.RIGHT,
        },
        {
            name: NODES_COLUMNS_IDS.Host,
            render: ({row}) => {
                return <NodeHostWrapper node={row} getNodeRef={getNodeRef} />;
            },
            width: '350px',
            align: DataTable.LEFT,
        },
        {
            name: NODES_COLUMNS_IDS.DC,
            header: 'DC',
            align: DataTable.LEFT,
            render: ({row}) => (row.DataCenter ? row.DataCenter : '—'),
            width: '60px',
        },
        {
            name: NODES_COLUMNS_IDS.Rack,
            header: 'Rack',
            align: DataTable.LEFT,
            render: ({row}) => (row.Rack ? row.Rack : '—'),
            width: '80px',
        },
        {
            name: NODES_COLUMNS_IDS.Version,
            width: '200px',
            align: DataTable.LEFT,
            render: ({row}) => {
                return <Popover content={row.Version}>{row.Version}</Popover>;
            },
        },
        {
            name: NODES_COLUMNS_IDS.Uptime,
            header: 'Uptime',
            sortAccessor: ({StartTime}) => StartTime && -StartTime,
            align: DataTable.RIGHT,
            width: '110px',
        },
        {
            name: NODES_COLUMNS_IDS.Memory,
            header: 'Memory',
            sortAccessor: ({MemoryUsed = 0}) => Number(MemoryUsed),
            defaultOrder: DataTable.DESCENDING,
            render: ({row}) => {
                if (row.MemoryUsed) {
                    return formatBytesToGigabyte(row.MemoryUsed);
                } else {
                    return '—';
                }
            },
            align: DataTable.RIGHT,
            width: '120px',
        },
        {
            name: NODES_COLUMNS_IDS.CPU,
            header: 'CPU',
            sortAccessor: ({PoolStats = []}) =>
                PoolStats.reduce((acc, item) => {
                    if (item.Usage) {
                        return acc + item.Usage;
                    } else {
                        return acc;
                    }
                }, 0),
            defaultOrder: DataTable.DESCENDING,
            render: ({row}) => (row.PoolStats ? <PoolsGraph pools={row.PoolStats} /> : '—'),
            align: DataTable.LEFT,
            width: '120px',
        },
        {
            name: NODES_COLUMNS_IDS.LoadAverage,
            header: 'Load average',
            sortAccessor: ({LoadAverage = []}) =>
                LoadAverage.slice(0, 1).reduce((acc, item) => acc + item, 0),
            defaultOrder: DataTable.DESCENDING,
            render: ({row}) =>
                row.LoadAverage && row.LoadAverage.length > 0 ? (
                    <ProgressViewer
                        value={row.LoadAverage[0]}
                        percents={true}
                        colorizeProgress={true}
                    />
                ) : (
                    '—'
                ),
            align: DataTable.LEFT,
            width: '140px',
        },
        {
            name: NODES_COLUMNS_IDS.Tablets,
            width: '430px',
            render: ({row}) => {
                return row.Tablets ? (
                    <TabletsStatistic
                        path={tabletsPath ?? row.TenantName}
                        nodeIds={[row.NodeId]}
                        tablets={row.Tablets}
                    />
                ) : (
                    '—'
                );
            },
            align: DataTable.LEFT,
        },
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesProperty(column.name)};
    });
}
