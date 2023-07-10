import cn from 'bem-cn-lite';
import {useDispatch} from 'react-redux';

import DataTable, {Column} from '@gravity-ui/react-data-table';
import {Button} from '@gravity-ui/uikit';

import EntityStatus from '../../components/EntityStatus/EntityStatus';
import {PoolsGraph} from '../../components/PoolsGraph/PoolsGraph';
import {TabletsStatistic} from '../../components/TabletsStatistic';
import {ProblemFilter} from '../../components/ProblemFilter';
import {Illustration} from '../../components/Illustration';
import {Search} from '../../components/Search';
import {TableLayout} from '../../components/TableLayout/TableLayout';
import {ResponseError} from '../../components/Errors/ResponseError';

import type {AdditionalTenantsProps} from '../../types/additionalProps';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {getTenantsInfo, setSearchValue} from '../../store/reducers/tenants/tenants';
import {
    selectFilteredTenants,
    selectTenantsSearchValue,
} from '../../store/reducers/tenants/selectors';
import {
    changeFilter,
    ProblemFilterValues,
    selectProblemFilter,
} from '../../store/reducers/settings/settings';
import {formatCPU, formatBytesToGigabyte, formatNumber} from '../../utils';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';
import {clusterName} from '../../store';

import {TenantTabsGroups, TENANT_INFO_TABS, getTenantPath} from '../Tenant/TenantPages';

import './Tenants.scss';

const b = cn('tenants');

interface TenantsProps {
    additionalTenantsProps?: AdditionalTenantsProps;
}

export const Tenants = ({additionalTenantsProps}: TenantsProps) => {
    const dispatch = useDispatch();

    const {error, loading, wasLoaded} = useTypedSelector((state) => state.tenants);
    const searchValue = useTypedSelector(selectTenantsSearchValue);
    const filteredTenants = useTypedSelector(selectFilteredTenants);
    const problemFilter = useTypedSelector(selectProblemFilter);

    useAutofetcher(
        () => {
            dispatch(getTenantsInfo(clusterName));
        },
        [dispatch],
        true,
    );

    const handleProblemFilterChange = (value: string) => {
        dispatch(changeFilter(value as ProblemFilterValue));
    };

    const handleSearchChange = (value: string) => {
        dispatch(setSearchValue(value));
    };

    const renderControls = () => {
        return (
            <>
                <Search
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder="Database name"
                    className={b('search')}
                />
                <ProblemFilter value={problemFilter} onChange={handleProblemFilterChange} />
            </>
        );
    };

    const renderTable = () => {
        const initialTenantInfoTab = TENANT_INFO_TABS[0].id;

        const getTenantBackend = (tenant: PreparedTenant) => {
            const backend = tenant.MonitoringEndpoint ?? tenant.backend;
            return additionalTenantsProps?.prepareTenantBackend?.(backend);
        };

        const columns: Column<PreparedTenant>[] = [
            {
                name: 'Name',
                header: 'Database',
                render: ({row}) => {
                    const backend = getTenantBackend(row);
                    const isExternalLink = Boolean(backend);
                    return (
                        <div className={b('name-wrapper')}>
                            <EntityStatus
                                externalLink={isExternalLink}
                                className={b('name')}
                                name={row.Name || 'unknown database'}
                                withLeftTrim={true}
                                status={row.Overall}
                                hasClipboardButton
                                path={getTenantPath({
                                    name: row.Name,
                                    backend,
                                    [TenantTabsGroups.info]: initialTenantInfoTab,
                                })}
                            />
                            {additionalTenantsProps?.getMonitoringLink?.(row.Name, row.Type)}
                        </div>
                    );
                },
                width: 440,
                sortable: true,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'controlPlaneName',
                header: 'Name',
                render: ({row}) => {
                    return row.controlPlaneName;
                },
                width: 200,
                sortable: true,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'Type',
                width: 200,
                render: ({row}) => {
                    if (row.Type !== 'Serverless') {
                        return row.Type;
                    }

                    return (
                        <div className={b('type')}>
                            <span className={b('type-value')}>{row.Type}</span>
                            <Button
                                className={b('type-button')}
                                onClick={() => handleSearchChange(row.sharedTenantName || '')}
                            >
                                Show shared
                            </Button>
                        </div>
                    );
                },
            },
            {
                name: 'State',
                width: 90,
                render: ({row}) => (row.State ? row.State.toLowerCase() : '—'),
                customStyle: () => ({textTransform: 'capitalize'}),
            },
            {
                name: 'cpu',
                header: 'CPU',
                width: 80,
                render: ({row}) => {
                    // Don't show values below 0.01 when formatted
                    if (row.cpu > 10_000) {
                        return formatCPU(row.cpu);
                    }
                    return '—';
                },
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'memory',
                header: 'Memory',
                width: 120,
                render: ({row}) => (row.memory ? formatBytesToGigabyte(row.memory) : '—'),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'storage',
                header: 'Storage',
                width: 120,
                render: ({row}) => (row.storage ? formatBytesToGigabyte(row.storage) : '—'),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'nodesCount',
                header: 'Nodes',
                width: 100,
                render: ({row}) => (row.nodesCount ? formatNumber(row.nodesCount) : '—'),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'groupsCount',
                header: 'Groups',
                width: 100,
                render: ({row}) => (row.groupsCount ? formatNumber(row.groupsCount) : '—'),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'PoolStats',
                header: 'Pools',
                width: 100,
                sortAccessor: ({PoolStats = []}) =>
                    PoolStats.reduce((acc, item) => acc + (item.Usage || 0), 0),
                defaultOrder: DataTable.DESCENDING,
                align: DataTable.LEFT,
                render: ({row}) => <PoolsGraph pools={row.PoolStats} />,
            },
            {
                name: 'Tablets',
                header: 'Tablets States',
                sortable: false,
                width: 430,
                render: ({row}) => {
                    const backend = getTenantBackend(row);

                    return row.Tablets ? (
                        <TabletsStatistic
                            path={row.Name}
                            tablets={row.Tablets}
                            nodeIds={row.NodeIds || []}
                            backend={backend}
                        />
                    ) : (
                        '—'
                    );
                },
            },
        ];

        if (filteredTenants.length === 0 && problemFilter !== ProblemFilterValues.ALL) {
            return <Illustration name="thumbsUp" width="200" />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                data={filteredTenants}
                columns={columns}
                settings={DEFAULT_TABLE_SETTINGS}
                emptyDataMessage="No such tenants"
            />
        );
    };

    if (error) {
        return <ResponseError error={error} />;
    }

    return (
        <TableLayout>
            <TableLayout.Controls>{renderControls()}</TableLayout.Controls>
            <TableLayout.Table loading={loading && !wasLoaded} className={b('table')}>
                {renderTable()}
            </TableLayout.Table>
        </TableLayout>
    );
};
