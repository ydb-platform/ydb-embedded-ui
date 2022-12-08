import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import _ from 'lodash';

import DataTable from '@yandex-cloud/react-data-table';
import {Loader, TextInput, Button} from '@gravity-ui/uikit';

import EntityStatus from '../../components/EntityStatus/EntityStatus';
import PoolsGraph from '../../components/PoolsGraph/PoolsGraph';
import TabletsStatistic from '../../components/TabletsStatistic/TabletsStatistic';
import {ProblemFilter} from '../../components/ProblemFilter';
import {Illustration} from '../../components/Illustration';
import {AutoFetcher} from '../../utils/autofetcher';

import routes, {CLUSTER_PAGES, createHref} from '../../routes';
import {formatCPU, formatBytesToGigabyte, formatNumber} from '../../utils';
import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {withSearch} from '../../HOCS';
import {ALL, DEFAULT_TABLE_SETTINGS, TENANT_INITIAL_TAB_KEY} from '../../utils/constants';
import {getTenantsInfo} from '../../store/reducers/tenants';
import {changeFilter, getSettingValue} from '../../store/reducers/settings';
import {setHeader} from '../../store/reducers/header';

import {clusterName} from '../../store';
import {TenantTabsGroups, TENANT_GENERAL_TABS, TENANT_INFO_TABS} from '../Tenant/TenantPages';

import './Tenants.scss';

const b = cn('tenants');

class Tenants extends React.Component {
    static renderLoader() {
        return (
            <div className={'loader'}>
                <Loader size="l" />
            </div>
        );
    }

    static propTypes = {
        loading: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        error: PropTypes.bool,
        getTenantsInfo: PropTypes.func,
        tenants: PropTypes.array,
        showTooltip: PropTypes.func,
        hideTooltip: PropTypes.func,
        searchQuery: PropTypes.string,
        handleSearchQuery: PropTypes.func,
        setHeader: PropTypes.func,
        filter: PropTypes.string,
        changeFilter: PropTypes.func,
        cluster: PropTypes.object,
        singleClusterMode: PropTypes.bool,
        additionalTenantsInfo: PropTypes.object,
    };

    static defaultProps = {
        className: '',
    };

    static filterTenants(tenants, filter) {
        if (filter === ALL) {
            return tenants;
        }

        return _.filter(tenants, (tenant) => {
            return tenant.Overall && tenant.Overall !== 'Green';
        });
    }

    componentDidMount() {
        this.autofetcher = new AutoFetcher();
        this.props.getTenantsInfo(clusterName);
        this.autofetcher.fetch(() => this.props.getTenantsInfo(clusterName));
        this.props.setHeader([
            {
                text: CLUSTER_PAGES.tenants.title,
                link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.tenants.id}),
            },
        ]);
    }

    componentWillUnmount() {
        this.autofetcher.stop();
    }

    renderControls() {
        const {searchQuery, handleSearchQuery, filter, changeFilter} = this.props;

        return (
            <div className={b('controls')}>
                <TextInput
                    className={b('search')}
                    placeholder="Database name"
                    value={searchQuery}
                    onUpdate={handleSearchQuery}
                    hasClear
                    autoFocus
                />
                <ProblemFilter value={filter} onChange={changeFilter} />
            </div>
        );
    }

    getControlPlaneValue = (item) => {
        const parts = _.get(item, 'Name', []).split('/');
        const defaultValue = parts.length ? parts[parts.length - 1] : '—';

        return _.get(item, 'ControlPlane.name', defaultValue);
    };

    renderTable = () => {
        const {
            tenants = [],
            searchQuery,
            showTooltip,
            hideTooltip,
            filter,
            handleSearchQuery,
            additionalTenantsInfo = {},
            savedTenantInitialTab,
        } = this.props;

        const filteredTenantsBySearch = tenants.filter((item) => {
            const re = new RegExp(searchQuery, 'i');
            return re.test(item.Name) || re.test(this.getControlPlaneValue(item));
        });
        const filteredTenants = Tenants.filterTenants(filteredTenantsBySearch, filter);

        const initialTenantGeneralTab = savedTenantInitialTab || TENANT_GENERAL_TABS[0].id;
        const initialTenantInfoTab = TENANT_INFO_TABS[0].id;

        const columns = [
            {
                name: 'Name',
                header: 'Database',
                render: ({value, row}) => {
                    const backend = row.MonitoringEndpoint ?? row.backend;
                    const tenantBackend = additionalTenantsInfo.tenantBackend
                        ? additionalTenantsInfo.tenantBackend(backend)
                        : undefined;
                    const isExternalLink = Boolean(backend);
                    return (
                        <div className={b('name-wrapper')}>
                            <EntityStatus
                                externalLink={isExternalLink}
                                className={b('name')}
                                name={value || 'unknown database'}
                                withLeftTrim={true}
                                status={row.Overall}
                                hasClipboardButton
                                path={createHref(routes.tenant, undefined, {
                                    name: value,
                                    backend: tenantBackend,
                                    [TenantTabsGroups.info]: initialTenantInfoTab,
                                    [TenantTabsGroups.general]: initialTenantGeneralTab,
                                })}
                            />
                            {additionalTenantsInfo.name && additionalTenantsInfo.name(value, row)}
                        </div>
                    );
                },
                width: 440,
                sortable: true,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'ControlPlaneName',
                header: 'Name',
                render: ({row}) => {
                    return this.getControlPlaneValue(row);
                },
                width: 200,
                sortable: true,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'Type',
                width: 200,
                render: ({value, row}) => {
                    if (value !== 'Serverless') {
                        return value;
                    }

                    const sharedTenantName = _.find(tenants, {Id: row.ResourceId}).Name;

                    return (
                        <div className={b('type')}>
                            <span className={b('type-value')}>{value}</span>
                            <Button
                                className={b('type-button')}
                                onClick={() => handleSearchQuery(sharedTenantName)}
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
                render: ({value}) => (value ? value.toLowerCase() : '—'),
                customStyle: () => ({textTransform: 'capitalize'}),
            },
            {
                name: 'cpu',
                header: 'CPU',
                width: 80,
                sortAccessor: ({Metrics = {}, CoresUsed}) => {
                    const cpuRaw =
                        CoresUsed !== undefined ? Number(CoresUsed) * 1_000_000 : Metrics.CPU;
                    return isNaN(Number(cpuRaw)) ? 0 : Number(cpuRaw);
                },
                accessor: ({Metrics = {}, CoresUsed}) => {
                    if (!isNaN(Number(CoresUsed))) {
                        const cores = Math.round(Number(CoresUsed) * 100) / 100;
                        return cores || '—';
                    } else {
                        return Number(Metrics.CPU) ? formatCPU(Number(Metrics.CPU)) : '—';
                    }
                },
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'memory',
                header: 'Memory',
                width: 120,
                accessor: ({Metrics = {}, MemoryUsed}) => {
                    return !isNaN(Number(MemoryUsed)) ? Number(MemoryUsed) : Number(Metrics.Memory);
                },
                sortAccessor: ({Metrics = {}, MemoryUsed}) => {
                    const memory = MemoryUsed ?? Metrics.Memory;
                    return isNaN(Number(memory)) ? 0 : Number(memory);
                },
                render: ({value}) => (value ? formatBytesToGigabyte(value) : '—'),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'storage',
                header: 'Storage',
                width: 120,
                accessor: ({Metrics = {}, StorageAllocatedSize}) => {
                    return !isNaN(Number(StorageAllocatedSize))
                        ? Number(StorageAllocatedSize)
                        : Number(Metrics.Storage);
                },
                sortAccessor: ({Metrics = {}, StorageAllocatedSize}) => {
                    const storage = StorageAllocatedSize ?? Metrics.Storage;
                    return isNaN(Number(storage)) ? 0 : Number(storage);
                },
                render: ({value}) => (value ? formatBytesToGigabyte(value) : '—'),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'NodeIds',
                header: 'Nodes',
                width: 100,
                accessor: ({NodeIds}) => NodeIds?.length || 0,
                sortAccessor: ({NodeIds}) => NodeIds?.length || 0,
                render: ({value}) => formatNumber(value),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'StorageGroups',
                header: 'Groups',
                width: 100,
                sortAccessor: ({StorageGroups}) =>
                    isNaN(Number(StorageGroups)) ? 0 : Number(StorageGroups),
                render: ({value}) => formatNumber(value) || '—',
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'PoolStats',
                header: 'Pools',
                width: 100,
                sortAccessor: ({PoolStats = []}) =>
                    PoolStats.reduce((acc, item) => acc + item.Usage, 0),
                defaultOrder: DataTable.DESCENDING,
                align: DataTable.CENTER,
                render: ({value}) => (
                    <PoolsGraph
                        onMouseEnter={showTooltip}
                        onMouseLeave={hideTooltip}
                        rowInfo={value}
                        pools={value}
                    />
                ),
            },
            {
                name: 'Tablets',
                header: 'Tablets States',
                sortable: false,
                width: 430,
                render: ({value, row}) =>
                    value ? (
                        <TabletsStatistic path={row.Name} tablets={value} nodeIds={row.NodeIds} />
                    ) : (
                        '—'
                    ),
            },
        ];

        if (filteredTenants.length === 0 && filter !== ALL) {
            return <Illustration name="thumbsUp" width="200" />;
        }

        return (
            <div className={b('table-wrapper')}>
                <div className={b('table-content')}>
                    <DataTable
                        theme="yandex-cloud"
                        data={filteredTenants}
                        columns={columns}
                        settings={DEFAULT_TABLE_SETTINGS}
                        dynamicRender={true}
                        emptyDataMessage="No such tenants"
                    />
                </div>
            </div>
        );
    };

    renderContent = () => {
        return (
            <div className={b()}>
                {this.renderControls()}
                {this.renderTable()}
            </div>
        );
    };

    render() {
        const {loading, wasLoaded, error} = this.props;

        if (loading && !wasLoaded) {
            return Tenants.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            return this.renderContent();
        }
    }
}

const mapStateToProps = (state) => {
    const {tenants, wasLoaded, loading, error} = state.tenants;
    const {singleClusterMode} = state;

    return {
        singleClusterMode,
        tenants,
        wasLoaded,
        loading,
        error,
        filter: state.settings.problemFilter,
        savedTenantInitialTab: getSettingValue(state, TENANT_INITIAL_TAB_KEY),
    };
};

const mapDispatchToProps = {
    getTenantsInfo,
    hideTooltip,
    showTooltip,
    changeFilter,
    setHeader,
};

export default withSearch(connect(mapStateToProps, mapDispatchToProps)(Tenants));
