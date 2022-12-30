import cn from 'bem-cn-lite';
import DataTable from '@yandex-cloud/react-data-table';
import {Button, Popover} from '@gravity-ui/uikit';

import Icon from '../components/Icon/Icon';
import EntityStatus from '../components/EntityStatus/EntityStatus';
import PoolsGraph from '../components/PoolsGraph/PoolsGraph';
import ProgressViewer from '../components/ProgressViewer/ProgressViewer';
import TabletsStatistic from '../components/TabletsStatistic/TabletsStatistic';

import {getDefaultNodePath} from '../containers/Node/NodePages';
import {formatBytes} from './index';

const b = cn('kv-nodes');

export function getNodesColumns({showTooltip, hideTooltip, tabletsPath, getNodeRef}) {
    const columns = [
        {
            name: 'NodeId',
            header: '#',
            width: '80px',
            align: DataTable.RIGHT,
        },
        {
            name: 'Host',
            render: ({row, value}) => {
                const nodeRef = getNodeRef ? getNodeRef(row) + 'internal' : undefined;

                if (typeof value === 'undefined') {
                    return <span>—</span>;
                }
                return (
                    <div className={b('host-name-wrapper')}>
                        <EntityStatus
                            name={row.Host}
                            onNameMouseEnter={(e) => showTooltip(e.target, row, 'nodeEndpoints')}
                            onNameMouseLeave={hideTooltip}
                            status={row.Overall}
                            path={getDefaultNodePath(row.NodeId)}
                            hasClipboardButton
                            className={b('host-name')}
                        />
                        {nodeRef && (
                            <Button size="s" href={nodeRef} className={b('external-button')} target="_blank">
                                <Icon name="external" />
                            </Button>
                        )}
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
            render: ({value}) => (value ? value : '—'),
            width: '60px',
        },
        {
            name: 'Rack',
            header: 'Rack',
            align: DataTable.LEFT,
            render: ({value}) => (value ? value : '—'),
            width: '80px',
        },
        {
            name: 'Version',
            width: '200px',
            align: DataTable.LEFT,
            render: ({value}) => {
                return <Popover content={value}>{value}</Popover>;
            },
        },
        {
            name: 'uptime',
            header: 'Uptime',
            sortAccessor: ({StartTime}) => -StartTime,
            align: DataTable.LEFT,
            width: '110px',
        },
        {
            name: 'MemoryUsed',
            header: 'Memory',
            sortAccessor: ({MemoryUsed = 0}) => Number(MemoryUsed),
            defaultOrder: DataTable.DESCENDING,
            render: ({value, row}) => {
                if (value) {
                    return formatBytes(value);
                }
                if (row.Metrics) {
                    return formatBytes(row.Metrics.Memory);
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
                PoolStats.reduce((acc, item) => acc + item.Usage, 0),
            defaultOrder: DataTable.DESCENDING,
            render: ({value}) =>
                value ? (
                    <PoolsGraph
                        onMouseEnter={showTooltip}
                        onMouseLeave={hideTooltip}
                        pools={value}
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
            render: ({value}) =>
                value && value.length > 0 ? (
                    <ProgressViewer value={value[0]} percents={true} colorizeProgress={true} />
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
