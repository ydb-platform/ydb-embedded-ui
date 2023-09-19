import DataTable, {Column} from '@gravity-ui/react-data-table';

import type {PreparedClusterNode} from '../../../store/reducers/clusterNodes/types';
import {isUnavailableNode} from '../../../utils/nodes';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {formatBytes} from '../../../utils/dataFormatters/dataFormatters';
import {getDefaultNodePath} from '../../Node/NodePages';

import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {PoolsGraph} from '../../../components/PoolsGraph/PoolsGraph';
import EntityStatus from '../../../components/EntityStatus/EntityStatus';

const columns: Column<PreparedClusterNode>[] = [
    {
        name: 'NodeId',
        header: '#',
        width: '80px',
        align: DataTable.LEFT,
        render: ({row}) => row.NodeId,
    },
    {
        name: 'Host',
        render: ({row}) => {
            const port =
                row.Endpoints && row.Endpoints.find((item) => item.Name === 'http-mon')?.Address;
            const host = row.Host && `${row.Host}${port || ''}`;
            const title = host || 'unknown';

            const nodePath =
                !isUnavailableNode(row) && row.NodeId ? getDefaultNodePath(row.NodeId) : undefined;

            return (
                <EntityStatus name={title} path={nodePath} hasClipboardButton showStatus={false} />
            );
        },
        width: '400px',
        align: DataTable.LEFT,
    },
    {
        name: 'Endpoints',
        sortable: false,
        render: ({row}) =>
            row.Endpoints
                ? row.Endpoints.map(({Name, Address}) => `${Name} ${Address}`).join(', ')
                : '-',
        width: '300px',
        align: DataTable.LEFT,
    },
    {
        name: 'uptime',
        header: 'Uptime',
        sortAccessor: ({StartTime}) => StartTime && -StartTime,
        width: '120px',
        align: DataTable.LEFT,
        render: ({row}) => row.uptime,
    },
    {
        name: 'MemoryUsed',
        header: 'Memory used',
        sortAccessor: ({MemoryUsed = 0}) => Number(MemoryUsed),
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) => (row.MemoryUsed ? formatBytes(row.MemoryUsed) : '—'),
        width: '120px',
        align: DataTable.RIGHT,
    },
    {
        name: 'MemoryLimit',
        header: 'Memory limit',
        sortAccessor: ({MemoryLimit = 0}) => Number(MemoryLimit),
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) => (row.MemoryLimit ? formatBytes(row.MemoryLimit) : '—'),
        width: '120px',
        align: DataTable.RIGHT,
    },
    {
        name: 'PoolStats',
        header: 'Pools',
        sortAccessor: ({PoolStats = []}) =>
            PoolStats.reduce((acc, item) => acc + (item.Usage || 0), 0),
        defaultOrder: DataTable.DESCENDING,
        width: '120px',
        render: ({row}) => (row.PoolStats ? <PoolsGraph pools={row.PoolStats} /> : '—'),
        align: DataTable.LEFT,
    },
    {
        name: 'LoadAverage',
        header: 'Load average',
        sortAccessor: ({LoadAverage = []}) =>
            LoadAverage.slice(0, 1).reduce((acc, item) => acc + item, 0),
        defaultOrder: DataTable.DESCENDING,
        width: '200px',
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
    },
];

interface NodesTableProps {
    nodes: PreparedClusterNode[];
}

export const NodesTable = ({nodes}: NodesTableProps) => {
    return (
        <DataTable
            theme="yandex-cloud"
            data={nodes}
            columns={columns}
            settings={DEFAULT_TABLE_SETTINGS}
        />
    );
};
