import DataTable from '@gravity-ui/react-data-table';
import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';

import {CellWithPopover} from '../../../components/CellWithPopover/CellWithPopover';
import {NodeHostWrapper} from '../../../components/NodeHostWrapper/NodeHostWrapper';
import {PoolsGraph} from '../../../components/PoolsGraph/PoolsGraph';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {TabletsStatistic} from '../../../components/TabletsStatistic';
import {UsageLabel} from '../../../components/UsageLabel/UsageLabel';
import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import {getLoadSeverityForNode} from '../../../store/reducers/nodes/utils';
import type {GetNodeRefFunc} from '../../../types/additionalProps';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {formatStorageValuesToGb} from '../../../utils/dataFormatters/dataFormatters';
import {isSortableNodesProperty} from '../../../utils/nodes';

import {NODES_COLUMNS_IDS, NODES_COLUMNS_TITLES} from './constants';
import type {GetNodesColumnsProps, NodesColumn} from './types';

const nodeIdColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.NodeId,
    header: '#',
    width: 80,
    render: ({row}) => row.NodeId,
    align: DataTable.RIGHT,
    sortable: false,
};

const getHostColumn = (getNodeRef?: GetNodeRefFunc, database?: string): NodesColumn => ({
    name: NODES_COLUMNS_IDS.Host,
    header: NODES_COLUMNS_TITLES.Host,
    render: ({row}) => {
        return <NodeHostWrapper node={row} getNodeRef={getNodeRef} database={database} />;
    },
    width: 350,
    align: DataTable.LEFT,
    sortable: false,
});
const nodeNameColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.NodeName,
    header: NODES_COLUMNS_TITLES.NodeName,
    align: DataTable.LEFT,
    render: ({row}) => row.NodeName || EMPTY_DATA_PLACEHOLDER,
    width: 200,
};

const getHostColumnWithUndefinedWidth = (
    getNodeRef?: GetNodeRefFunc,
): DataTableColumn<NodesPreparedEntity> => {
    return {...getHostColumn(getNodeRef), width: undefined};
};

const dataCenterColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.DC,
    header: NODES_COLUMNS_TITLES.DC,
    align: DataTable.LEFT,
    render: ({row}) => row.DC || EMPTY_DATA_PLACEHOLDER,
    width: 60,
};

const rackColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.Rack,
    header: NODES_COLUMNS_TITLES.Rack,
    align: DataTable.LEFT,
    render: ({row}) => (row.Rack ? row.Rack : '—'),
    width: 80,
};

const versionColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.Version,
    header: NODES_COLUMNS_TITLES.Version,
    width: 200,
    align: DataTable.LEFT,
    render: ({row}) => {
        return <CellWithPopover content={row.Version}>{row.Version}</CellWithPopover>;
    },
    sortable: false,
};

const uptimeColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.Uptime,
    header: NODES_COLUMNS_TITLES.Uptime,
    sortAccessor: ({StartTime}) => StartTime && -StartTime,
    render: ({row}) => row.Uptime,
    align: DataTable.RIGHT,
    width: 110,
    sortable: false,
};

const memoryColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.Memory,
    header: NODES_COLUMNS_TITLES.Memory,
    sortAccessor: ({MemoryUsed = 0}) => Number(MemoryUsed),
    defaultOrder: DataTable.DESCENDING,
    render: ({row}) => (
        <ProgressViewer
            value={row.MemoryUsed}
            capacity={row.MemoryLimit}
            formatValues={formatStorageValuesToGb}
            colorizeProgress={true}
        />
    ),
    align: DataTable.RIGHT,
    width: 120,
};

const cpuColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.CPU,
    header: NODES_COLUMNS_TITLES.CPU,
    sortAccessor: ({PoolStats = []}) => Math.max(...PoolStats.map(({Usage}) => Number(Usage))),
    defaultOrder: DataTable.DESCENDING,
    render: ({row}) => (row.PoolStats ? <PoolsGraph pools={row.PoolStats} /> : '—'),
    align: DataTable.LEFT,
    width: 80,
    resizeMinWidth: 60,
    sortable: false,
};

const loadAverageColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.LoadAverage,
    header: NODES_COLUMNS_TITLES.LoadAverage,
    sortAccessor: ({LoadAveragePercents = []}) => LoadAveragePercents[0],
    defaultOrder: DataTable.DESCENDING,
    render: ({row}) => (
        <ProgressViewer
            value={
                row.LoadAveragePercents && row.LoadAveragePercents.length > 0
                    ? row.LoadAveragePercents[0]
                    : undefined
            }
            percents={true}
            colorizeProgress={true}
            capacity={100}
        />
    ),
    align: DataTable.LEFT,
    width: 140,
    resizeMinWidth: 140,
    sortable: false,
};

const getTabletsColumn = (tabletsPath?: string): NodesColumn => ({
    name: NODES_COLUMNS_IDS.Tablets,
    header: NODES_COLUMNS_TITLES.Tablets,
    width: 500,
    resizeMinWidth: 500,
    render: ({row}) => {
        return row.Tablets ? (
            <TabletsStatistic
                path={tabletsPath ?? row.TenantName}
                nodeId={row.NodeId}
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
    header: NODES_COLUMNS_TITLES.TopNodesLoadAverage,
    render: ({row}) =>
        row.LoadAveragePercents && row.LoadAveragePercents.length > 0 ? (
            <UsageLabel
                value={row.LoadAveragePercents[0].toFixed()}
                theme={getLoadSeverityForNode(row.LoadAveragePercents[0])}
            />
        ) : (
            '—'
        ),
    align: DataTable.LEFT,
    width: 80,
    resizeMinWidth: 70,
    sortable: false,
};

const topNodesMemoryColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.TopNodesMemory,
    header: NODES_COLUMNS_TITLES.TopNodesMemory,
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
    resizeMinWidth: 140,
    sortable: false,
};

const sharedCacheUsageColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.SharedCacheUsage,
    header: NODES_COLUMNS_TITLES.SharedCacheUsage,
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
    resizeMinWidth: 140,
    sortable: false,
};

const sessionsColumn: NodesColumn = {
    name: NODES_COLUMNS_IDS.TotalSessions,
    header: NODES_COLUMNS_TITLES.TotalSessions,
    render: ({row}) => row.TotalSessions ?? '—',
    align: DataTable.RIGHT,
    width: 100,
    sortable: false,
};

export function getNodesColumns({database, getNodeRef}: GetNodesColumnsProps): NodesColumn[] {
    const columns = [
        nodeIdColumn,
        getHostColumn(getNodeRef, database),
        nodeNameColumn,
        dataCenterColumn,
        rackColumn,
        versionColumn,
        uptimeColumn,
        memoryColumn,
        cpuColumn,
        loadAverageColumn,
        getTabletsColumn(database),
    ];

    return columns.map((column) => {
        return {...column, sortable: isSortableNodesProperty(column.name)};
    });
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
    database,
    getNodeRef,
}: GetNodesColumnsProps): NodesColumn[] {
    return [
        nodeIdColumn,
        getHostColumn(getNodeRef, database),
        uptimeColumn,
        topNodesLoadAverageColumn,
        topNodesMemoryColumn,
        sharedCacheUsageColumn,
        sessionsColumn,
        getTabletsColumn(database),
    ];
}
