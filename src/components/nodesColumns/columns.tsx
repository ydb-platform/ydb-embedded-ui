import DataTable from '@gravity-ui/react-data-table';

import {getLoadSeverityForNode} from '../../store/reducers/nodes/utils';
import type {TPoolStats} from '../../types/api/nodes';
import type {TTabletStateInfo} from '../../types/api/tablet';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {NodeHostWrapper} from '../NodeHostWrapper/NodeHostWrapper';
import type {NodeHostData} from '../NodeHostWrapper/NodeHostWrapper';
import {PoolsGraph} from '../PoolsGraph/PoolsGraph';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {TabletsStatistic} from '../TabletsStatistic';
import {UsageLabel} from '../UsageLabel/UsageLabel';

import {NODES_COLUMNS_IDS, NODES_COLUMNS_TITLES} from './constants';
import type {Column, GetNodesColumnsParams} from './types';

export function getNodeIdColumn<T extends {NodeId?: string | number}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.NodeId,
        header: '#',
        width: 80,
        render: ({row}) => row.NodeId,
        align: DataTable.RIGHT,
    };
}
export function getHostColumn<T extends NodeHostData>({
    getNodeRef,
    database,
}: GetNodesColumnsParams): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Host,
        header: NODES_COLUMNS_TITLES.Host,
        render: ({row}) => {
            return <NodeHostWrapper node={row} getNodeRef={getNodeRef} database={database} />;
        },
        width: 350,
        align: DataTable.LEFT,
    };
}
export function getNodeNameColumn<T extends {NodeName?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.NodeName,
        header: NODES_COLUMNS_TITLES.NodeName,
        align: DataTable.LEFT,
        render: ({row}) => row.NodeName || EMPTY_DATA_PLACEHOLDER,
        width: 200,
    };
}
export function getDataCenterColumn<T extends {DC?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.DC,
        header: NODES_COLUMNS_TITLES.DC,
        align: DataTable.LEFT,
        render: ({row}) => row.DC || EMPTY_DATA_PLACEHOLDER,
        width: 60,
    };
}
export function getRackColumn<T extends {Rack?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Rack,
        header: NODES_COLUMNS_TITLES.Rack,
        align: DataTable.LEFT,
        render: ({row}) => row.Rack || EMPTY_DATA_PLACEHOLDER,
        width: 100,
    };
}
export function getVersionColumn<T extends {Version?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Version,
        header: NODES_COLUMNS_TITLES.Version,
        width: 200,
        align: DataTable.LEFT,
        render: ({row}) => {
            return <CellWithPopover content={row.Version}>{row.Version}</CellWithPopover>;
        },
    };
}
export function getUptimeColumn<T extends {StartTime?: string; Uptime?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Uptime,
        header: NODES_COLUMNS_TITLES.Uptime,
        sortAccessor: ({StartTime}) => (StartTime ? -StartTime : 0),
        render: ({row}) => row.Uptime,
        align: DataTable.RIGHT,
        width: 110,
    };
}
export function getMemoryColumn<
    T extends {MemoryUsed?: string; MemoryLimit?: string},
>(): Column<T> {
    return {
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
        align: DataTable.LEFT,
        width: 140,
        resizeMinWidth: 140,
    };
}
export function getSharedCacheUsageColumn<
    T extends {SharedCacheUsed?: string | number; SharedCacheLimit?: string | number},
>(): Column<T> {
    return {
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
    };
}
export function getCpuColumn<T extends {PoolStats?: TPoolStats[]}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.CPU,
        header: NODES_COLUMNS_TITLES.CPU,
        sortAccessor: ({PoolStats = []}) => Math.max(...PoolStats.map(({Usage}) => Number(Usage))),
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) =>
            row.PoolStats ? <PoolsGraph pools={row.PoolStats} /> : EMPTY_DATA_PLACEHOLDER,
        align: DataTable.LEFT,
        width: 80,
        resizeMinWidth: 60,
    };
}
export function getLoadAverageColumn<T extends {LoadAveragePercents?: number[]}>(): Column<T> {
    return {
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
    };
}
// The same as loadAverage, but more compact
export function getLoadColumn<T extends {LoadAveragePercents?: number[]}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Load,
        header: NODES_COLUMNS_TITLES.Load,
        sortAccessor: ({LoadAveragePercents = []}) => LoadAveragePercents[0],
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) =>
            row.LoadAveragePercents && row.LoadAveragePercents.length > 0 ? (
                <UsageLabel
                    value={row.LoadAveragePercents[0].toFixed()}
                    theme={getLoadSeverityForNode(row.LoadAveragePercents[0])}
                />
            ) : (
                EMPTY_DATA_PLACEHOLDER
            ),
        align: DataTable.LEFT,
        width: 80,
        resizeMinWidth: 70,
    };
}
export function getSessionsColumn<T extends {TotalSessions?: number}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.TotalSessions,
        header: NODES_COLUMNS_TITLES.TotalSessions,
        render: ({row}) => row.TotalSessions ?? EMPTY_DATA_PLACEHOLDER,
        align: DataTable.RIGHT,
        width: 100,
    };
}
export function getTabletsColumn<
    T extends {
        TenantName?: string;
        NodeId: string | number;
        Tablets?: TTabletStateInfo[];
    },
>({database}: GetNodesColumnsParams): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Tablets,
        header: NODES_COLUMNS_TITLES.Tablets,
        width: 500,
        resizeMinWidth: 500,
        render: ({row}) => {
            return row.Tablets ? (
                <TabletsStatistic
                    tenantName={database ?? row.TenantName}
                    nodeId={row.NodeId}
                    tablets={row.Tablets}
                />
            ) : (
                EMPTY_DATA_PLACEHOLDER
            );
        },
        align: DataTable.LEFT,
        sortable: false,
    };
}
export function getMissingDisksColumn<T extends {Missing?: number}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Missing,
        header: NODES_COLUMNS_TITLES.Missing,
        render: ({row}) => row.Missing,
        align: DataTable.CENTER,
        defaultOrder: DataTable.DESCENDING,
    };
}
