import DataTable from '@gravity-ui/react-data-table';
import {DefinitionList} from '@gravity-ui/uikit';

import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {TMemoryStats, TPoolStats} from '../../types/api/nodes';
import type {TTabletStateInfo} from '../../types/api/tablet';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {
    formatPercent,
    formatStorageValues,
    formatStorageValuesToGb,
} from '../../utils/dataFormatters/dataFormatters';
import {getUsageSeverity} from '../../utils/generateEvaluator';
import type {Column} from '../../utils/tableUtils/types';
import {formatToMs, parseUsToMs} from '../../utils/timeParsers';
import {bytesToSpeed, isNumeric} from '../../utils/utils';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {MemoryViewer} from '../MemoryViewer/MemoryViewer';
import {NodeHostWrapper} from '../NodeHostWrapper/NodeHostWrapper';
import {PoolsGraph} from '../PoolsGraph/PoolsGraph';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {TabletsStatistic} from '../TabletsStatistic';
import {formatPool} from '../TooltipsContent';
import {NodeUptime} from '../UptimeViewer/UptimeViewer';
import {UsageLabel} from '../UsageLabel/UsageLabel';

import {NODES_COLUMNS_IDS, NODES_COLUMNS_TITLES} from './constants';
import i18n from './i18n';
import type {GetNodesColumnsParams} from './types';
import {prepareClockSkewValue, preparePingTimeValue} from './utils';

import './NodesColumns.scss';

const b = cn('ydb-nodes-columns');

export function getNodeIdColumn<T extends {NodeId?: string | number}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.NodeId,
        header: '#',
        width: 80,
        resizeMinWidth: 80,
        render: ({row}) => row.NodeId,
        align: DataTable.RIGHT,
    };
}
export function getHostColumn<T extends PreparedStorageNode>({
    database,
}: GetNodesColumnsParams): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Host,
        header: NODES_COLUMNS_TITLES.Host,
        render: ({row}) => {
            return <NodeHostWrapper node={row} database={database} />;
        },
        width: 350,
        align: DataTable.LEFT,
    };
}

// Different column for different set of required fields
// ConnectStatus is required here, it makes handler to return network stats
// On versions before 25-1-2 ConnectStatus also makes handler to return peers - it can significantly increase response size
export function getNetworkHostColumn<T extends PreparedStorageNode>({
    database,
}: GetNodesColumnsParams): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.NetworkHost,
        header: NODES_COLUMNS_TITLES.NetworkHost,
        render: ({row}) => {
            return (
                <NodeHostWrapper node={row} database={database} statusForIcon={'ConnectStatus'} />
            );
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

export function getDatabaseColumn<T extends {Database?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Database,
        header: NODES_COLUMNS_TITLES.Database,
        align: DataTable.LEFT,
        render: ({row}) => row.Database || EMPTY_DATA_PLACEHOLDER,
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

export function getPileNameColumn<T extends {PileName?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.PileName,
        header: i18n('field_pile-name'),
        align: DataTable.LEFT,
        render: ({row}) => row.PileName || EMPTY_DATA_PLACEHOLDER,
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
export function getUptimeColumn<
    T extends {StartTime?: string; DisconnectTime?: string},
>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Uptime,
        header: NODES_COLUMNS_TITLES.Uptime,
        sortAccessor: ({StartTime}) => (StartTime ? -StartTime : 0),
        render: ({row}) => {
            return <NodeUptime StartTime={row.StartTime} DisconnectTime={row.DisconnectTime} />;
        },
        align: DataTable.RIGHT,
        width: 120,
    };
}

export function getRAMColumn<T extends {MemoryUsed?: string; MemoryLimit?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.RAM,
        header: NODES_COLUMNS_TITLES.RAM,
        sortAccessor: ({MemoryUsed = 0}) => Number(MemoryUsed),
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) => {
            const [memoryUsed, memoryLimit] = formatStorageValues(
                isNumeric(row.MemoryUsed) ? Number(row.MemoryUsed) : undefined,
                isNumeric(row.MemoryLimit) ? Number(row.MemoryLimit) : undefined,
                'gb',
                undefined,
                true,
            );

            const hasData = memoryUsed || memoryLimit;

            return (
                <CellWithPopover
                    placement={['top', 'bottom']}
                    fullWidth
                    disabled={!hasData}
                    content={
                        <DefinitionList responsive>
                            {memoryUsed && (
                                <DefinitionList.Item name={i18n('field_memory-used')}>
                                    {memoryUsed}
                                </DefinitionList.Item>
                            )}
                            {memoryLimit && (
                                <DefinitionList.Item name={i18n('field_memory-limit')}>
                                    {memoryLimit}
                                </DefinitionList.Item>
                            )}
                        </DefinitionList>
                    }
                >
                    <ProgressViewer
                        value={row.MemoryUsed}
                        capacity={row.MemoryLimit}
                        formatValues={(value, total) =>
                            formatStorageValues(value, total, 'gb', undefined, true)
                        }
                        className={b('column-ram')}
                        colorizeProgress
                        hideCapacity
                    />
                </CellWithPopover>
            );
        },
        align: DataTable.LEFT,
        width: 80,
        resizeMinWidth: 40,
    };
}
export function getMemoryColumn<
    T extends {MemoryStats?: TMemoryStats; MemoryUsed?: string; MemoryLimit?: string},
>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Memory,
        header: NODES_COLUMNS_TITLES.Memory,
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) => {
            return row.MemoryStats ? (
                <MemoryViewer formatValues={formatStorageValuesToGb} stats={row.MemoryStats} />
            ) : (
                <ProgressViewer
                    value={row.MemoryUsed}
                    capacity={row.MemoryLimit}
                    formatValues={formatStorageValuesToGb}
                    colorizeProgress={true}
                />
            );
        },
        align: DataTable.LEFT,
        width: 300,
        resizeMinWidth: 170,
    };
}
export function getPoolsColumn<T extends {PoolStats?: TPoolStats[]}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Pools,
        header: NODES_COLUMNS_TITLES.Pools,
        sortAccessor: ({PoolStats = []}) => Math.max(...PoolStats.map(({Usage}) => Number(Usage))),
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) =>
            row.PoolStats ? <PoolsGraph pools={row.PoolStats} /> : EMPTY_DATA_PLACEHOLDER,
        align: DataTable.LEFT,
        width: 80,
        resizeMinWidth: 60,
    };
}
export function getCpuColumn<
    T extends {PoolStats?: TPoolStats[]; CoresUsed?: number; CoresTotal?: number},
>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.CPU,
        header: NODES_COLUMNS_TITLES.CPU,
        sortAccessor: ({PoolStats = []}) => Math.max(...PoolStats.map(({Usage}) => Number(Usage))),
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) => {
            let totalPoolUsage =
                isNumeric(row.CoresUsed) && isNumeric(row.CoresTotal)
                    ? row.CoresUsed / row.CoresTotal
                    : undefined;

            if (totalPoolUsage === undefined && row.PoolStats) {
                let totalThreadsCount = 0;
                totalPoolUsage = row.PoolStats.reduce((acc, pool) => {
                    totalThreadsCount += Number(pool.Threads);
                    return acc + Number(pool.Usage) * Number(pool.Threads);
                }, 0);

                totalPoolUsage = totalPoolUsage / totalThreadsCount;
            }

            return (
                <CellWithPopover
                    placement={['top', 'bottom']}
                    fullWidth
                    disabled={!row.PoolStats}
                    content={
                        <DefinitionList responsive>
                            {row.PoolStats?.map((pool) =>
                                isNumeric(pool.Usage) ? (
                                    <DefinitionList.Item key={pool.Name} name={pool.Name}>
                                        {formatPool('Usage', pool.Usage).value}
                                    </DefinitionList.Item>
                                ) : null,
                            )}
                        </DefinitionList>
                    }
                >
                    <ProgressViewer
                        className={b('column-cpu')}
                        value={totalPoolUsage}
                        capacity={1}
                        colorizeProgress
                        percents
                    />
                </CellWithPopover>
            );
        },
        align: DataTable.LEFT,
        width: 80,
        resizeMinWidth: 40,
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
        width: 170,
        resizeMinWidth: 170,
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
                    theme={getUsageSeverity(row.LoadAveragePercents[0])}
                />
            ) : (
                EMPTY_DATA_PLACEHOLDER
            ),
        align: DataTable.LEFT,
        width: 80,
        resizeMinWidth: 70,
    };
}
export function getDiskSpaceUsageColumn<T extends {DiskSpaceUsage?: number}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.DiskSpaceUsage,
        header: NODES_COLUMNS_TITLES.DiskSpaceUsage,
        render: ({row}) => {
            return valueIsDefined(row.DiskSpaceUsage) ? (
                <UsageLabel
                    value={Math.floor(row.DiskSpaceUsage)}
                    theme={getUsageSeverity(row.DiskSpaceUsage)}
                />
            ) : (
                EMPTY_DATA_PLACEHOLDER
            );
        },
        align: DataTable.LEFT,
        width: 115,
        resizeMinWidth: 75,
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
                    database={database ?? row.TenantName}
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
        width: 100,
    };
}

// Network diagnostics columns
export function getConnectionsColumn<T extends {Connections?: number}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.Connections,
        header: NODES_COLUMNS_TITLES.Connections,
        render: ({row}) => (isNumeric(row.Connections) ? row.Connections : EMPTY_DATA_PLACEHOLDER),
        align: DataTable.RIGHT,
        width: 130,
    };
}
export function getNetworkUtilizationColumn<
    T extends {
        NetworkUtilization?: number;
        NetworkUtilizationMin?: number;
        NetworkUtilizationMax?: number;
    },
>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.NetworkUtilization,
        header: NODES_COLUMNS_TITLES.NetworkUtilization,
        render: ({row}) => {
            const {NetworkUtilization, NetworkUtilizationMin = 0, NetworkUtilizationMax = 0} = row;

            if (!isNumeric(NetworkUtilization)) {
                return EMPTY_DATA_PLACEHOLDER;
            }

            return (
                <CellWithPopover
                    placement={['top', 'bottom']}
                    content={
                        <DefinitionList responsive>
                            <DefinitionList.Item key={'NetworkUtilization'} name={i18n('sum')}>
                                {formatPercent(NetworkUtilization)}
                            </DefinitionList.Item>
                            <DefinitionList.Item key={'NetworkUtilizationMin'} name={i18n('min')}>
                                {formatPercent(NetworkUtilizationMin)}
                            </DefinitionList.Item>
                            <DefinitionList.Item key={'NetworkUtilizationMax'} name={i18n('max')}>
                                {formatPercent(NetworkUtilizationMax)}
                            </DefinitionList.Item>
                        </DefinitionList>
                    }
                >
                    {formatPercent(NetworkUtilization)}
                </CellWithPopover>
            );
        },
        align: DataTable.RIGHT,
        width: 110,
    };
}
export function getSendThroughputColumn<T extends {SendThroughput?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.SendThroughput,
        header: NODES_COLUMNS_TITLES.SendThroughput,
        render: ({row}) =>
            isNumeric(row.SendThroughput)
                ? bytesToSpeed(row.SendThroughput, 1)
                : EMPTY_DATA_PLACEHOLDER,
        align: DataTable.RIGHT,
        width: 110,
    };
}
export function getReceiveThroughputColumn<T extends {ReceiveThroughput?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.ReceiveThroughput,
        header: NODES_COLUMNS_TITLES.ReceiveThroughput,
        render: ({row}) =>
            isNumeric(row.ReceiveThroughput)
                ? bytesToSpeed(row.ReceiveThroughput, 1)
                : EMPTY_DATA_PLACEHOLDER,
        align: DataTable.RIGHT,
        width: 110,
    };
}
export function getPingTimeColumn<
    T extends {
        PingTimeUs?: string;
        PingTimeMinUs?: string;
        PingTimeMaxUs?: string;
    },
>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.PingTime,
        header: NODES_COLUMNS_TITLES.PingTime,
        render: ({row}) => {
            const {PingTimeUs, PingTimeMinUs = 0, PingTimeMaxUs = 0} = row;

            if (!isNumeric(PingTimeUs)) {
                return EMPTY_DATA_PLACEHOLDER;
            }

            return (
                <CellWithPopover
                    placement={['top', 'bottom']}
                    content={
                        <DefinitionList responsive>
                            <DefinitionList.Item key={'PingTimeUs'} name={i18n('avg')}>
                                {preparePingTimeValue(PingTimeUs)}
                            </DefinitionList.Item>
                            <DefinitionList.Item key={'PingTimeMinUs'} name={i18n('min')}>
                                {preparePingTimeValue(PingTimeMinUs)}
                            </DefinitionList.Item>
                            <DefinitionList.Item key={'PingTimeMaxUs'} name={i18n('max')}>
                                {preparePingTimeValue(PingTimeMaxUs)}
                            </DefinitionList.Item>
                        </DefinitionList>
                    }
                >
                    {preparePingTimeValue(PingTimeUs)}
                </CellWithPopover>
            );
        },
        align: DataTable.RIGHT,
        width: 110,
    };
}
export function getClockSkewColumn<
    T extends {ClockSkewUs?: string; ClockSkewMinUs?: string; ClockSkewMaxUs?: string},
>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.ClockSkew,
        header: NODES_COLUMNS_TITLES.ClockSkew,
        render: ({row}) => {
            const {ClockSkewUs, ClockSkewMinUs = 0, ClockSkewMaxUs = 0} = row;

            if (!isNumeric(ClockSkewUs)) {
                return EMPTY_DATA_PLACEHOLDER;
            }

            return (
                <CellWithPopover
                    placement={['top', 'bottom']}
                    content={
                        <DefinitionList responsive>
                            <DefinitionList.Item key={'ClockSkewUs'} name={i18n('avg')}>
                                {prepareClockSkewValue(ClockSkewUs)}
                            </DefinitionList.Item>
                            <DefinitionList.Item key={'ClockSkewMinUs'} name={i18n('min')}>
                                {prepareClockSkewValue(ClockSkewMinUs)}
                            </DefinitionList.Item>
                            <DefinitionList.Item key={'ClockSkewMaxUs'} name={i18n('max')}>
                                {prepareClockSkewValue(ClockSkewMaxUs)}
                            </DefinitionList.Item>
                        </DefinitionList>
                    }
                >
                    {prepareClockSkewValue(ClockSkewUs)}
                </CellWithPopover>
            );
        },
        align: DataTable.RIGHT,
        width: 110,
    };
}

// Peers columns

export function getPeerSkewColumn<T extends {ClockSkewUs?: string | number}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.ClockSkew,
        header: NODES_COLUMNS_TITLES.ClockSkew,
        align: DataTable.RIGHT,
        width: 110,
        resizeMinWidth: 90,
        render: ({row}) =>
            isNumeric(row.ClockSkewUs)
                ? formatToMs(parseUsToMs(row.ClockSkewUs, 1))
                : EMPTY_DATA_PLACEHOLDER,
    };
}

export function getPeerPingColumn<T extends {PingTimeUs?: string | number}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.PingTime,
        header: NODES_COLUMNS_TITLES.PingTime,
        align: DataTable.RIGHT,
        width: 110,
        resizeMinWidth: 90,
        render: ({row}) =>
            isNumeric(row.PingTimeUs)
                ? formatToMs(parseUsToMs(row.PingTimeUs))
                : EMPTY_DATA_PLACEHOLDER,
    };
}
