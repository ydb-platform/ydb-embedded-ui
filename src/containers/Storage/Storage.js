import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import DataTable from '@gravity-ui/react-data-table';

import {Search} from '../../components/Search';
import {UsageFilter} from './UsageFilter';
import {AutoFetcher} from '../../utils/autofetcher';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {AccessDenied} from '../../components/Errors/403';
import {EntitiesCount} from '../../components/EntitiesCount';

import {
    getStorageInfo,
    setInitialState,
    getFilteredEntities,
    setVisibleEntities,
    setStorageFilter,
    setUsageFilter,
    setStorageType,
    setNodesUptimeFilter,
    setDataWasNotLoaded,
    getStoragePoolsGroupsCount,
    getStorageNodesCount,
    getUsageFilterOptions,
} from '../../store/reducers/storage/storage';
import {VisibleEntities, StorageTypes} from '../../store/reducers/storage/constants';
import {getNodesList, selectNodesMap} from '../../store/reducers/nodesList';
import StorageGroups from './StorageGroups/StorageGroups';
import StorageNodes from './StorageNodes/StorageNodes';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';

import {StorageTypeFilter} from './StorageTypeFilter/StorageTypeFilter';
import {StorageVisibleEntityFilter} from './StorageVisibleEntityFilter/StorageVisibleEntityFilter';

import './Storage.scss';

const b = cn('global-storage');

const tableSettings = {
    ...DEFAULT_TABLE_SETTINGS,
    defaultOrder: DataTable.DESCENDING,
};

class Storage extends React.Component {
    static propTypes = {
        loading: PropTypes.bool,
        error: PropTypes.object,
        wasLoaded: PropTypes.bool,
        autorefresh: PropTypes.bool,
        database: PropTypes.bool,
        getStorageInfo: PropTypes.func,
        setInitialState: PropTypes.func,
        flatListStorageEntities: PropTypes.array,
        groupsCount: PropTypes.object,
        nodesCount: PropTypes.object,
        setStorageFilter: PropTypes.func,
        setVisibleEntities: PropTypes.func,
        visibleEntities: PropTypes.string,
        tenant: PropTypes.string,
        nodeId: PropTypes.string,
        nodesUptimeFilter: PropTypes.string,
        setNodesUptimeFilter: PropTypes.func,
        setDataWasNotLoaded: PropTypes.func,
        additionalNodesInfo: PropTypes.object,
    };

    componentDidMount() {
        const {tenant, nodeId, setVisibleEntities, storageType, getNodesList} = this.props;

        this.autofetcher = new AutoFetcher();
        getNodesList();
        if (tenant || nodeId) {
            setVisibleEntities(VisibleEntities.all);
            this.getStorageInfo({
                type: storageType,
            });
        } else {
            this.getStorageInfo({
                filter: VisibleEntities.missing,
                type: storageType,
            });
            this.autofetcher.fetch(() =>
                this.getStorageInfo({
                    filter: VisibleEntities.missing,
                    type: storageType,
                }),
            );
        }
    }

    componentDidUpdate(prevProps) {
        const {visibleEntities, storageType, autorefresh, database, tenant, setDataWasNotLoaded} =
            this.props;

        const startFetch = () => {
            this.getStorageInfo({
                filter: visibleEntities,
                type: storageType,
            });
        };

        const restartAutorefresh = () => {
            this.autofetcher.stop();
            this.autofetcher.start();
            this.autofetcher.fetch(() =>
                this.getStorageInfo({
                    filter: visibleEntities,
                    type: storageType,
                }),
            );
        };

        if (database && !autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }
        if (database && autorefresh && !prevProps.autorefresh) {
            startFetch();
            restartAutorefresh();
        }

        if (
            storageType !== prevProps.storageType ||
            visibleEntities !== prevProps.visibleEntities
        ) {
            startFetch();

            if (!database || (database && autorefresh)) {
                restartAutorefresh();
            }
        }

        if (tenant !== prevProps.tenant) {
            setDataWasNotLoaded();
            startFetch();
            restartAutorefresh();
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
        this.props.setInitialState();
    }

    getStorageInfo(data) {
        const {tenant, nodeId, getStorageInfo} = this.props;

        getStorageInfo(
            {
                tenant,
                nodeId,
                ...data,
            },
            {
                concurrentId: 'getStorageInfo',
            },
        );
    }

    renderLoader() {
        return <TableSkeleton className={b('loader')} />;
    }

    renderDataTable() {
        const {
            flatListStorageEntities,
            visibleEntities,
            nodesUptimeFilter,
            nodes,
            storageType,
            additionalNodesInfo,
        } = this.props;

        return (
            <div className={b('table-wrapper')}>
                {storageType === StorageTypes.groups && (
                    <StorageGroups
                        visibleEntities={visibleEntities}
                        data={flatListStorageEntities}
                        tableSettings={tableSettings}
                        nodes={nodes}
                        onShowAll={() => this.onGroupVisibilityChange(VisibleEntities.all)}
                    />
                )}
                {storageType === StorageTypes.nodes && (
                    <StorageNodes
                        visibleEntities={visibleEntities}
                        nodesUptimeFilter={nodesUptimeFilter}
                        data={flatListStorageEntities}
                        tableSettings={tableSettings}
                        onShowAll={this.onShowAllNodes}
                        additionalNodesInfo={additionalNodesInfo}
                    />
                )}
            </div>
        );
    }

    onGroupVisibilityChange = (value) => {
        const {setVisibleEntities} = this.props;
        setVisibleEntities(value);
    };

    onStorageTypeChange = (value) => {
        const {setStorageType} = this.props;
        setStorageType(value);
    };

    onUptimeFilterChange = (value) => {
        this.props.setNodesUptimeFilter(value);
    };

    onShowAllNodes = () => {
        this.onGroupVisibilityChange(VisibleEntities.all);
        this.onUptimeFilterChange(NodesUptimeFilterValues.All);
    };

    renderEntitiesCount() {
        const {storageType, groupsCount, nodesCount, flatListStorageEntities, loading, wasLoaded} =
            this.props;

        const entityName = storageType === StorageTypes.groups ? 'Groups' : 'Nodes';
        const count = storageType === StorageTypes.groups ? groupsCount : nodesCount;

        return (
            <EntitiesCount
                label={entityName}
                loading={loading && !wasLoaded}
                total={count.total}
                current={flatListStorageEntities.length}
            />
        );
    }

    renderControls() {
        const {
            filter,
            setStorageFilter,
            visibleEntities,
            storageType,
            usageFilter,
            nodesUptimeFilter,
            setUsageFilter,
            usageFilterOptions,
        } = this.props;

        return (
            <div className={b('controls')}>
                <div className={b('search')}>
                    <Search
                        placeholder={
                            storageType === StorageTypes.groups
                                ? 'Group ID, Pool name'
                                : 'Node ID, FQDN'
                        }
                        onChange={setStorageFilter}
                        value={filter}
                    />
                </div>

                <StorageTypeFilter value={storageType} onChange={this.onStorageTypeChange} />
                <StorageVisibleEntityFilter
                    value={visibleEntities}
                    onChange={this.onGroupVisibilityChange}
                />

                {storageType === StorageTypes.nodes && (
                    <UptimeFilter value={nodesUptimeFilter} onChange={this.onUptimeFilterChange} />
                )}

                {storageType === StorageTypes.groups && (
                    <UsageFilter
                        value={usageFilter}
                        onChange={setUsageFilter}
                        groups={usageFilterOptions}
                        disabled={usageFilterOptions.length === 0}
                    />
                )}
                {this.renderEntitiesCount()}
            </div>
        );
    }

    render() {
        const {loading, wasLoaded, error} = this.props;
        const showLoader = loading && !wasLoaded;

        if (error) {
            if (error.status === 403) {
                return <AccessDenied />;
            }

            return <div className={b()}>{error.statusText}</div>;
        }

        return (
            <div className={b()}>
                {this.renderControls()}
                {showLoader ? this.renderLoader() : this.renderDataTable()}
            </div>
        );
    }
}

function mapStateToProps(state) {
    const {
        loading,
        wasLoaded,
        error,
        visible: visibleEntities,
        type: storageType,
        filter,
        usageFilter,
        nodesUptimeFilter,
    } = state.storage;

    return {
        flatListStorageEntities: getFilteredEntities(state),
        groupsCount: getStoragePoolsGroupsCount(state),
        autorefresh: state.schema.autorefresh,
        nodes: selectNodesMap(state),
        nodesCount: getStorageNodesCount(state),
        loading,
        wasLoaded,
        error,
        visibleEntities,
        storageType,
        filter,
        usageFilter,
        nodesUptimeFilter,
        usageFilterOptions: getUsageFilterOptions(state),
    };
}

const mapDispatchToProps = {
    getStorageInfo,
    setInitialState,
    setStorageFilter,
    setUsageFilter,
    setVisibleEntities: setVisibleEntities,
    setNodesUptimeFilter,
    getNodesList,
    setStorageType,
    setDataWasNotLoaded,
};

export default connect(mapStateToProps, mapDispatchToProps)(Storage);
