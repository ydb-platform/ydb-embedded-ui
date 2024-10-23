import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {EntityStatus} from '../../../components/EntityStatus/EntityStatus';
import {PoolsGraph} from '../../../components/PoolsGraph/PoolsGraph';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {formatBytes} from '../../../utils/dataFormatters/dataFormatters';
import type {PreparedNodeSystemState} from '../../../utils/nodes';
import {isUnavailableNode} from '../../../utils/nodes';
import {getDefaultNodePath} from '../../Node/NodePages';

const VERSIONS_COLUMNS_WIDTH_LS_KEY = 'versionsTableColumnsWidth';

const columns: Column<PreparedNodeSystemState>[] = [
    {
        name: 'NodeId',
        header: '#',
        width: 80,
        resizeMinWidth: 80,
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
        width: 400,
        align: DataTable.LEFT,
    },
    {
        name: 'Endpoints',
        sortable: false,
        render: ({row}) =>
            row.Endpoints
                ? row.Endpoints.map(({Name, Address}) => `${Name} ${Address}`).join(', ')
                : '-',
        width: 300,
        align: DataTable.LEFT,
    },
    {
        name: 'Uptime',
        header: 'Uptime',
        sortAccessor: ({StartTime}) => StartTime && -StartTime,
        width: 120,
        align: DataTable.LEFT,
        render: ({row}) => row.Uptime,
    },
    {
        name: 'MemoryUsed',
        header: 'Memory used',
        sortAccessor: ({MemoryUsed = 0}) => Number(MemoryUsed),
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) => (row.MemoryUsed ? formatBytes(row.MemoryUsed) : '—'),
        width: 120,
        align: DataTable.RIGHT,
    },
    {
        name: 'MemoryLimit',
        header: 'Memory limit',
        sortAccessor: ({MemoryLimit = 0}) => Number(MemoryLimit),
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) => (row.MemoryLimit ? formatBytes(row.MemoryLimit) : '—'),
        width: 120,
        align: DataTable.RIGHT,
    },
    {
        name: 'PoolStats',
        header: 'Pools',
        sortAccessor: ({PoolStats = []}) =>
            PoolStats.reduce((acc, item) => acc + (item.Usage || 0), 0),
        defaultOrder: DataTable.DESCENDING,
        width: 80,
        resizeMinWidth: 60,
        render: ({row}) => (row.PoolStats ? <PoolsGraph pools={row.PoolStats} /> : '—'),
        align: DataTable.LEFT,
    },
    {
        name: 'LoadAverage',
        header: 'Load average',
        sortAccessor: ({LoadAveragePercents = []}) => LoadAveragePercents[0],
        defaultOrder: DataTable.DESCENDING,
        width: 170,
        resizeMinWidth: 170,
        render: ({row}) =>
            row.LoadAveragePercents && row.LoadAveragePercents.length > 0 ? (
                <ProgressViewer
                    value={row.LoadAveragePercents[0]}
                    percents={true}
                    capacity={100}
                    colorizeProgress={true}
                />
            ) : (
                '—'
            ),
        align: DataTable.LEFT,
    },
];

interface NodesTableProps {
    nodes: PreparedNodeSystemState[];
}

export const NodesTable = ({nodes}: NodesTableProps) => {
    return (
        <ResizeableDataTable
            columnsWidthLSKey={VERSIONS_COLUMNS_WIDTH_LS_KEY}
            data={nodes}
            columns={columns}
            settings={DEFAULT_TABLE_SETTINGS}
        />
    );
};
