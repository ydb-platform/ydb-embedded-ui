import cn from 'bem-cn-lite';
import DataTable, {Column} from '@gravity-ui/react-data-table';
import {Button, Popover, PopoverBehavior} from '@gravity-ui/uikit';

import {IconWrapper} from '../../components/Icon';
import EntityStatus from '../../components/EntityStatus/EntityStatus';
import PoolsGraph from '../../components/PoolsGraph/PoolsGraph';
import ProgressViewer from '../../components/ProgressViewer/ProgressViewer';
import {TabletsStatistic} from '../../components/TabletsStatistic';
import {NodeEndpointsTooltip} from '../../components/Tooltips/NodeEndpointsTooltip/NodeEndpointsTooltip';

import {formatBytesToGigabyte} from '../../utils/index';
import {INodesPreparedEntity} from '../../types/store/nodes';
import {showTooltip as externalShowTooltip} from '../../store/reducers/tooltip';

import {getDefaultNodePath} from '../Node/NodePages';

import './NodesTable.scss';

const b = cn('ydb-nodes-table');

interface GetNodesColumnsProps {
    showTooltip: (...args: Parameters<typeof externalShowTooltip>) => void;
    hideTooltip: VoidFunction;
    tabletsPath?: string;
    getNodeRef?: Function;
}

export function getNodesColumns({
    showTooltip,
    hideTooltip,
    tabletsPath,
    getNodeRef,
}: GetNodesColumnsProps) {
    const columns: Column<INodesPreparedEntity>[] = [
        {
            name: 'NodeId',
            header: '#',
            width: '80px',
            align: DataTable.RIGHT,
        },
        {
            name: 'Host',
            render: ({row}) => {
                const nodeRef = getNodeRef ? getNodeRef(row) + 'internal' : undefined;
                if (typeof row.Host === 'undefined') {
                    return <span>—</span>;
                }
                return (
                    <div className={b('host-field-wrapper')}>
                        <Popover
                            content={<NodeEndpointsTooltip data={row} />}
                            placement={['top', 'bottom']}
                            behavior={PopoverBehavior.Immediate}
                        >
                            <div className={b('host-wrapper')}>
                                <EntityStatus
                                    name={row.Host}
                                    status={row.SystemState}
                                    path={getDefaultNodePath(row.NodeId)}
                                    hasClipboardButton
                                    className={b('host')}
                                />
                                {nodeRef && (
                                    <Button
                                        size="s"
                                        href={nodeRef}
                                        className={b('external-button')}
                                        target="_blank"
                                    >
                                        <IconWrapper name="external" />
                                    </Button>
                                )}
                            </div>
                        </Popover>
                    </div>
                );
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
            render: ({row}) =>
                row.PoolStats ? (
                    <PoolsGraph
                        onMouseEnter={showTooltip}
                        onMouseLeave={hideTooltip}
                        pools={row.PoolStats}
                    />
                ) : (
                    '—'
                ),
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
