import DataTable from '@gravity-ui/react-data-table';
import {DefinitionList} from '@gravity-ui/uikit';

import {getLoadSeverityForNode} from '../../store/reducers/nodes/utils';
import type {TPoolStats} from '../../types/api/nodes';
import type {TTabletStateInfo} from '../../types/api/tablet';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {
    formatStorageValues,
    formatStorageValuesToGb,
} from '../../utils/dataFormatters/dataFormatters';
import {getSpaceUsageSeverity} from '../../utils/storage';
import type {Column} from '../../utils/tableUtils/types';
import {isNumeric} from '../../utils/utils';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {NodeHostWrapper} from '../NodeHostWrapper/NodeHostWrapper';
import type {NodeHostData} from '../NodeHostWrapper/NodeHostWrapper';
import {PoolsGraph} from '../PoolsGraph/PoolsGraph';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {TabletsStatistic} from '../TabletsStatistic';
import {formatPool} from '../TooltipsContent';
import {UsageLabel} from '../UsageLabel/UsageLabel';

import {NODES_COLUMNS_IDS, NODES_COLUMNS_TITLES} from './constants';
import i18n from './i18n';
import type {GetNodesColumnsParams} from './types';

import './NodesColumns.scss';

const b = cn('ydb-nodes-columns');

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
        width: 170,
        resizeMinWidth: 170,
    };
}

export function getRAMColumn<T extends {MemoryUsed?: string; MemoryLimit?: string}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.RAM,
        header: NODES_COLUMNS_TITLES.RAM,
        sortAccessor: ({MemoryUsed = 0}) => Number(MemoryUsed),
        defaultOrder: DataTable.DESCENDING,
        render: ({row}) => {
            const [memoryUsed, memoryLimit] =
                isNumeric(row.MemoryUsed) && isNumeric(row.MemoryLimit)
                    ? formatStorageValues(
                          Number(row.MemoryUsed),
                          Number(row.MemoryLimit),
                          'gb',
                          undefined,
                          true,
                      )
                    : [0, 0];
            return (
                <CellWithPopover
                    placement={['top', 'auto']}
                    fullWidth
                    content={
                        <DefinitionList responsive>
                            <DefinitionList.Item name={i18n('field_memory-used')}>
                                {memoryUsed}
                            </DefinitionList.Item>
                            <DefinitionList.Item name={i18n('field_memory-limit')}>
                                {memoryLimit}
                            </DefinitionList.Item>
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
        width: 170,
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
            if (!row.PoolStats) {
                return EMPTY_DATA_PLACEHOLDER;
            }

            let totalPoolUsage =
                isNumeric(row.CoresUsed) && isNumeric(row.CoresTotal)
                    ? row.CoresUsed / row.CoresTotal
                    : undefined;

            if (totalPoolUsage === undefined) {
                let totalThreadsCount = 0;
                totalPoolUsage = row.PoolStats.reduce((acc, pool) => {
                    totalThreadsCount += Number(pool.Threads);
                    return acc + Number(pool.Usage) * Number(pool.Threads);
                }, 0);

                totalPoolUsage = totalPoolUsage / totalThreadsCount;
            }

            return (
                <CellWithPopover
                    placement={['top', 'auto']}
                    fullWidth
                    content={
                        <DefinitionList responsive>
                            {row.PoolStats.map((pool) =>
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
export function getDiskSpaceUsageColumn<T extends {DiskSpaceUsage?: number}>(): Column<T> {
    return {
        name: NODES_COLUMNS_IDS.DiskSpaceUsage,
        header: NODES_COLUMNS_TITLES.DiskSpaceUsage,
        render: ({row}) => {
            return valueIsDefined(row.DiskSpaceUsage) ? (
                <UsageLabel
                    value={Math.floor(row.DiskSpaceUsage)}
                    theme={getSpaceUsageSeverity(row.DiskSpaceUsage)}
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
    };
}
