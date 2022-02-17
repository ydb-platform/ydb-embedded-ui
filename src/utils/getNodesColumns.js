import _ from 'lodash';
import DataTable from '@yandex-cloud/react-data-table';
import {Link as ExternalLink, Tooltip} from '@yandex-cloud/uikit';

import Icon from '../components/Icon/Icon';
import EntityStatus from '../components/EntityStatus/EntityStatus';
import {STORAGE_ROLE} from '../containers/Node/Node';
import PoolsGraph from '../components/PoolsGraph/PoolsGraph';
import ProgressViewer from '../components/ProgressViewer/ProgressViewer';
import TabletsStatistic from '../components/TabletsStatistic/TabletsStatistic';

import routes, {createHref} from '../routes';
import {STORAGE, TABLETS} from '../containers/Node/NodePages';
import {formatBytes} from './index';

export function getNodesColumns({showTooltip, hideTooltip, tabletsPath, getNodeRef}) {
    const columns = [
        {
            name: 'NodeId',
            header: '#',
            width: '80px',
            align: DataTable.RIGHT,
        },
        {
            name: 'NodeRef',
            header: '',
            sortable: false,
            render: ({row}) => {
                const nodeRef = getNodeRef ? getNodeRef(row) : undefined;
                return (
                    nodeRef && (
                        <ExternalLink href={nodeRef}>
                            <Icon name="external" />
                        </ExternalLink>
                    )
                );
            },
            width: '40px',
            align: DataTable.LEFT,
        },
        {
            name: 'Host',
            render: ({row, value}) => {
                const hasStorage = _.find(row?.Roles, (el) => el === STORAGE_ROLE);
                if (typeof value === 'undefined') {
                    return <span>—</span>;
                }
                return (
                    <EntityStatus
                        name={row.Host}
                        status={row.Overall}
                        path={createHref(routes.node, {
                            id: row.NodeId,
                            activeTab: hasStorage ? STORAGE : TABLETS,
                        })}
                        hasClipboardButton
                    />
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
            name: 'Version',
            width: '200px',
            align: DataTable.LEFT,
            render: ({value}) => {
                return <Tooltip content={value}>{value}</Tooltip>;
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
            width: '330px',
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
