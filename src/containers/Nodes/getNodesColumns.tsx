import cn from 'bem-cn-lite';

import DataTable, {type Column} from '@gravity-ui/react-data-table';
import {Label, Popover} from '@gravity-ui/uikit';

import {PoolsGraph} from '../../components/PoolsGraph/PoolsGraph';
import {ProgressViewer} from '../../components/ProgressViewer/ProgressViewer';
import {TabletsStatistic} from '../../components/TabletsStatistic';
import {NodeHostWrapper} from '../../components/NodeHostWrapper/NodeHostWrapper';
import {formatBytesToGigabyte} from '../../utils/dataFormatters/dataFormatters';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {NodeAddress} from '../../types/additionalProps';
import {getLoadSeverityForNode} from '../../store/reducers/tenantOverview/topNodes/utils';

const b = cn('node');

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

const nodeIdColumn: Column<NodesPreparedEntity> = {
    name: NODES_COLUMNS_IDS.NodeId,
    header: '#',
    width: '80px',
    align: DataTable.RIGHT,
    sortable: false,
};

const getHostColumn = (
    getNodeRef?: (node?: NodeAddress) => string | null,
): Column<NodesPreparedEntity> => ({
    name: NODES_COLUMNS_IDS.Host,
    render: ({row}) => {
        return <NodeHostWrapper node={row} getNodeRef={getNodeRef} />;
    },
    width: '350px',
    align: DataTable.LEFT,
    sortable: false,
});

const dataCenterColumn: Column<NodesPreparedEntity> = {
    name: NODES_COLUMNS_IDS.DC,
    header: 'DC',
    align: DataTable.LEFT,
    render: ({row}) => (row.DataCenter ? row.DataCenter : '—'),
    width: '60px',
};

const rackColumn: Column<NodesPreparedEntity> = {
    name: NODES_COLUMNS_IDS.Rack,
    header: 'Rack',
    align: DataTable.LEFT,
    render: ({row}) => (row.Rack ? row.Rack : '—'),
    width: '80px',
};

const versionColumn: Column<NodesPreparedEntity> = {
    name: NODES_COLUMNS_IDS.Version,
    width: '200px',
    align: DataTable.LEFT,
    render: ({row}) => {
        return <Popover content={row.Version}>{row.Version}</Popover>;
    },
    sortable: false,
};

const uptimeColumn: Column<NodesPreparedEntity> = {
    name: NODES_COLUMNS_IDS.Uptime,
    header: 'Uptime',
    sortAccessor: ({StartTime}) => StartTime && -StartTime,
    align: DataTable.RIGHT,
    width: '110px',
};

const memoryColumn: Column<NodesPreparedEntity> = {
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
};

const cpuColumn: Column<NodesPreparedEntity> = {
    name: NODES_COLUMNS_IDS.CPU,
    header: 'CPU',
    sortAccessor: ({PoolStats = []}) => Math.max(...PoolStats.map(({Usage}) => Number(Usage))),
    defaultOrder: DataTable.DESCENDING,
    render: ({row}) => (row.PoolStats ? <PoolsGraph pools={row.PoolStats} /> : '—'),
    align: DataTable.LEFT,
    width: '120px',
    sortable: false,
};

const loadAverageColumn: Column<NodesPreparedEntity> = {
    name: NODES_COLUMNS_IDS.LoadAverage,
    header: 'Load average',
    sortAccessor: ({LoadAverage = []}) =>
        LoadAverage.slice(0, 1).reduce((acc, item) => acc + item, 0),
    defaultOrder: DataTable.DESCENDING,
    render: ({row}) =>
        row.LoadAverage && row.LoadAverage.length > 0 ? (
            <ProgressViewer value={row.LoadAverage[0]} percents={true} colorizeProgress={true} />
        ) : (
            '—'
        ),
    align: DataTable.LEFT,
    width: '140px',
    sortable: false,
};

const getTabletsColumn = (tabletsPath?: string): Column<NodesPreparedEntity> => ({
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
});

const topNodesLoadAverageColumn: Column<NodesPreparedEntity> = {
    name: NODES_COLUMNS_IDS.LoadAverage,
    header: 'Load',
    sortAccessor: ({LoadAverage = []}) =>
        LoadAverage.slice(0, 1).reduce((acc, item) => acc + item, 0),
    defaultOrder: DataTable.DESCENDING,
    render: ({row}) =>
        row.LoadAverage && row.LoadAverage.length > 0 ? (
            <>
                <Label
                    theme={getLoadSeverityForNode(row.LoadAverage[0])}
                    className={b('usage-label', {overload: row.LoadAverage[0] >= 90})}
                >
                    {row.LoadAverage[0].toFixed()}%
                </Label>
            </>
        ) : (
            '—'
        ),
    align: DataTable.LEFT,
    width: 80,
    sortable: false,
};

export function getNodesColumns({
    tabletsPath,
    getNodeRef,
}: GetNodesColumnsProps): Column<NodesPreparedEntity>[] {
    return [
        nodeIdColumn,
        getHostColumn(getNodeRef),
        dataCenterColumn,
        rackColumn,
        versionColumn,
        uptimeColumn,
        memoryColumn,
        cpuColumn,
        loadAverageColumn,
        getTabletsColumn(tabletsPath),
    ];
}

export function getTopNodesColumns(
    getNodeRef?: (node?: NodeAddress) => string | null,
): Column<NodesPreparedEntity>[] {
    return [topNodesLoadAverageColumn, nodeIdColumn, getHostColumn(getNodeRef), versionColumn];
}

export function getTopPoolsColumns(
    getNodeRef?: (node?: NodeAddress) => string | null,
): Column<NodesPreparedEntity>[] {
    return [cpuColumn, nodeIdColumn, getHostColumn(getNodeRef)];
}
