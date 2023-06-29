import DataTable, {Column} from '@gravity-ui/react-data-table';
import {Popover} from '@gravity-ui/uikit';

import {PoolsGraph} from '../../components/PoolsGraph/PoolsGraph';
import ProgressViewer from '../../components/ProgressViewer/ProgressViewer';
import {TabletsStatistic} from '../../components/TabletsStatistic';
import {NodeHostWrapper} from '../../components/NodeHostWrapper/NodeHostWrapper';

import type {NodeAddress} from '../../utils/nodes';
import {formatBytesToGigabyte} from '../../utils/index';

import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';

interface GetNodesColumnsProps {
    tabletsPath?: string;
    getNodeRef?: (node?: NodeAddress) => string | null;
}

export function getNodesColumns({tabletsPath, getNodeRef}: GetNodesColumnsProps) {
    const columns: Column<NodesPreparedEntity>[] = [
        {
            name: 'NodeId',
            header: '#',
            width: '80px',
            align: DataTable.RIGHT,
        },
        {
            name: 'Host',
            render: ({row}) => {
                return <NodeHostWrapper node={row} getNodeRef={getNodeRef} />;
            },
            width: '350px',
            align: DataTable.LEFT,
        },
        {
            name: 'DataCenter',
            header: 'DC',
            align: DataTable.LEFT,
            render: ({row}) => (row.DataCenter ? row.DataCenter : '—'),
            width: '60px',
        },
        {
            name: 'Rack',
            header: 'Rack',
            align: DataTable.LEFT,
            render: ({row}) => (row.Rack ? row.Rack : '—'),
            width: '80px',
        },
        {
            name: 'Version',
            width: '200px',
            align: DataTable.LEFT,
            render: ({row}) => {
                return <Popover content={row.Version}>{row.Version}</Popover>;
            },
        },
        {
            name: 'Uptime',
            header: 'Uptime',
            sortAccessor: ({StartTime}) => StartTime && -StartTime,
            align: DataTable.RIGHT,
            width: '110px',
        },
        {
            name: 'MemoryUsed',
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
            name: 'PoolStats',
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
            name: 'LoadAverage',
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
            name: 'Tablets',
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

    return columns;
}
