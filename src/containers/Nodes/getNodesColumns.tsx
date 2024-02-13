import DataTable, {type Column as DataTableColumn} from '@gravity-ui/react-data-table';

import type {Column as VirtualTableColumn} from '../../components/VirtualTable';
import {PoolsGraph} from '../../components/PoolsGraph/PoolsGraph';
import {ProgressViewer} from '../../components/ProgressViewer/ProgressViewer';
import {TabletsStatistic} from '../../components/TabletsStatistic';
import {NodeHostWrapper} from '../../components/NodeHostWrapper/NodeHostWrapper';
import {
    formatBytesToGigabyte,
    formatStorageValuesToGb,
} from '../../utils/dataFormatters/dataFormatters';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {GetNodeRefFunc} from '../../types/additionalProps';
import {getLoadSeverityForNode} from '../../store/reducers/nodes/utils';
import {UsageLabel} from '../../components/UsageLabel/UsageLabel';
import {CellWithPopover} from '../../components/CellWithPopover/CellWithPopover';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';

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
    TopNodesLoadAverage: 'TopNodesLoadAverage',
    TopNodesMemory: 'TopNodesMemory',
    SharedCacheUsage: 'SharedCacheUsage',
    MemoryUsedInAlloc: 'MemoryUsedInAlloc',
    TotalSessions: 'TotalSessions',
};

interface GetNodesColumnsProps {
    tabletsPath?: string;
    getNodeRef?: GetNodeRefFunc;
}

type NodesColumn = VirtualTableColumn<NodesPreparedEntity> & DataTableColumn<NodesPreparedEntity>;

const nodeIdColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.NodeId,
    header: '#',
    width: 80,
    render: ({row}) => row.NodeId,
    align: DataTable.RIGHT,
    sortable: false,
};

const getHostColumn = (getNodeRef?: GetNodeRefFunc): NodesColumn => ({
    name: NODES_COLUMNS_IDS.Host,
    render: ({row}) => {
        return <NodeHostWrapper node={row} getNodeRef={getNodeRef} />;
    },
    width: 350,
    align: DataTable.LEFT,
    sortable: false,
});

const getHostColumnWithUndefinedWidth = (
    getNodeRef?: GetNodeRefFunc,
): DataTableColumn<NodesPreparedEntity> => {
    return {...getHostColumn(getNodeRef), width: undefined};
};

const dataCenterColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.DC,
    header: 'DC',
    align: DataTable.LEFT,
    render: ({row}) => row.DC || EMPTY_DATA_PLACEHOLDER,
    width: 60,
};

const rackColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.Rack,
    header: 'Rack',
    align: DataTable.LEFT,
    render: ({row}) => (row.Rack ? row.Rack : '—'),
    width: 80,
};

const versionColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.Version,
    width: 200,
    align: DataTable.LEFT,
    render: ({row}) => {
        return <CellWithPopover content={row.Version}>{row.Version}</CellWithPopover>;
    },
    sortable: false,
    resizeable: true,
};

const uptimeColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.Uptime,
    header: 'Uptime',
    sortAccessor: ({StartTime}) => StartTime && -StartTime,
    render: ({row}) => row.Uptime,
    align: DataTable.RIGHT,
    width: 110,
    sortable: false,
};

const memoryColumn: NodesColumn = {
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
    width: 120,
};

const cpuColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.CPU,
    header: 'CPU',
    sortAccessor: ({PoolStats = []}) => Math.max(...PoolStats.map(({Usage}) => Number(Usage))),
    defaultOrder: DataTable.DESCENDING,
    render: ({row}) => (row.PoolStats ? <PoolsGraph pools={row.PoolStats} /> : '—'),
    align: DataTable.LEFT,
    width: 80,
    sortable: false,
};

const loadAverageColumn: NodesColumn = {
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
                capacity={100}
            />
        ) : (
            '—'
        ),
    align: DataTable.LEFT,
    width: 140,
    sortable: false,
};

const getTabletsColumn = (tabletsPath?: string): NodesColumn => ({
    name: NODES_COLUMNS_IDS.Tablets,
    width: 430,
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
    sortable: false,
});

const topNodesLoadAverageColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.TopNodesLoadAverage,
    header: 'Load',
    render: ({row}) =>
        row.LoadAverage && row.LoadAverage.length > 0 ? (
            <UsageLabel
                value={row.LoadAverage[0].toFixed()}
                theme={getLoadSeverityForNode(row.LoadAverage[0])}
            />
        ) : (
            '—'
        ),
    align: DataTable.LEFT,
    width: 80,
    sortable: false,
};

const topNodesMemoryColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.TopNodesMemory,
    header: 'Process',
    render: ({row}) => (
        <ProgressViewer
            value={row.MemoryUsed}
            capacity={row.MemoryLimit}
            formatValues={formatStorageValuesToGb}
            colorizeProgress={true}
        />
    ),
    align: DataTable.LEFT,
    width: 140,
    sortable: false,
};

const sharedCacheUsageColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.SharedCacheUsage,
    header: 'Tablet Cache',
    render: ({row}) => (
        <ProgressViewer
            value={row.SharedCacheUsed}
            capacity={row.SharedCacheLimit}
            formatValues={formatStorageValuesToGb}
            colorizeProgress={true}
        />
    ),
    align: DataTable.LEFT,
    width: 140,
    sortable: false,
};

const memoryUsedInAllocColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.MemoryUsedInAlloc,
    header: 'Query Runtime',
    render: ({row}) => (
        <ProgressViewer
            value={row.MemoryUsedInAlloc}
            capacity={row.MemoryLimit}
            formatValues={formatStorageValuesToGb}
            colorizeProgress={true}
        />
    ),
    align: DataTable.LEFT,
    width: 140,
    sortable: false,
};

const sessionsColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.TotalSessions,
    header: 'Sessions',
    render: ({row}) => row.TotalSessions ?? '—',
    align: DataTable.RIGHT,
    width: 100,
    sortable: false,
};

export function getNodesColumns({tabletsPath, getNodeRef}: GetNodesColumnsProps): NodesColumn[] {
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

export function getTopNodesByLoadColumns(
    getNodeRef?: GetNodeRefFunc,
): DataTableColumn<NodesPreparedEntity>[] {
    return [
        topNodesLoadAverageColumn,
        nodeIdColumn,
        getHostColumnWithUndefinedWidth(getNodeRef),
        versionColumn,
    ];
}

export function getTopNodesByCpuColumns(
    getNodeRef?: GetNodeRefFunc,
): DataTableColumn<NodesPreparedEntity>[] {
    return [cpuColumn, nodeIdColumn, getHostColumnWithUndefinedWidth(getNodeRef)];
}

export function getTopNodesByMemoryColumns({
    tabletsPath,
    getNodeRef,
}: GetNodesColumnsProps): NodesColumn[] {
    return [
        nodeIdColumn,
        getHostColumn(getNodeRef),
        uptimeColumn,
        topNodesLoadAverageColumn,
        topNodesMemoryColumn,
        sharedCacheUsageColumn,
        memoryUsedInAllocColumn,
        sessionsColumn,
        getTabletsColumn(tabletsPath),
    ];
}
