import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import DataTable from '@yandex-cloud/react-data-table';
import {RadioButton, Label} from '@gravity-ui/uikit';

import {StorageFilter} from './StorageFilter';
import {UsageFilter} from './UsageFilter';
import {AutoFetcher} from '../../utils/autofetcher';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';

import {
    getStorageInfo,
    setInitialState,
    getFilteredEntities,
    VisibleEntities,
    setVisibleEntities,
    setStorageFilter,
    setUsageFilter,
    getNodesObject,
    StorageTypes,
    setStorageType,
    VisibleEntitiesTitles,
    getStoragePoolsGroupsCount,
    getStorageNodesCount,
    getUsageFilterOptions,
} from '../../store/reducers/storage';
import {getNodesList} from '../../store/reducers/clusterNodes';
import StorageGroups from './StorageGroups/StorageGroups';
import StorageNodes from './StorageNodes/StorageNodes';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {setHeader} from '../../store/reducers/header';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';

import './Storage.scss';

const b = cn('global-storage');

const FILTER_OPTIONS = {
    Missing: 'missing',
    Space: 'space',
};

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
        setHeader: PropTypes.func,
        tenant: PropTypes.string,
        nodeId: PropTypes.string,
    };

    componentDidMount() {
        const {
            tenant,
            nodeId,
            setVisibleEntities,
            storageType,
            setHeader,
            getNodesList,
        } = this.props;

        this.autofetcher = new AutoFetcher();
        getNodesList();
        if (tenant || nodeId) {
            setVisibleEntities(VisibleEntities.All);
            this.getStorageInfo({
                filter: FILTER_OPTIONS.All,
                type: storageType,
            });
        } else {
            setHeader([
                {
                    text: CLUSTER_PAGES.storage.title,
                    link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.storage.id}),
                },
            ]);
            this.getStorageInfo({
                filter: FILTER_OPTIONS.Missing,
                type: storageType,
            });
            this.autofetcher.fetch(() =>
                this.getStorageInfo({
                    filter: FILTER_OPTIONS.Missing,
                    type: storageType,
                }),
            );
        }
    }

    componentDidUpdate(prevProps) {
        const {
            visibleEntities,
            storageType,
            autorefresh,
            database,
        } = this.props;

        const startFetch = () => {
            this.getStorageInfo({
                filter: FILTER_OPTIONS[visibleEntities],
                type: storageType,
            });
        };

        const restartAutorefresh = () => {
            this.autofetcher.stop();
            this.autofetcher.start();
            this.autofetcher.fetch(() =>
                this.getStorageInfo({
                    filter: FILTER_OPTIONS[visibleEntities],
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

        if (storageType !== prevProps.storageType || visibleEntities !== prevProps.visibleEntities) {
            startFetch();

            if (!database || (database && autorefresh)) {
                restartAutorefresh();
            }
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
        this.props.setInitialState();
    }

    getStorageInfo(data) {
        const {
            tenant,
            nodeId,
            getStorageInfo,
        } = this.props;

        getStorageInfo({
            tenant,
            nodeId,
            ...data,
        }, {
            concurrentId: 'getStorageInfo',
        });
    }

    renderLoader() {
        return (
            <TableSkeleton className={b('loader')}/>
        );
    }

    renderDataTable() {
        const {flatListStorageEntities, visibleEntities, nodes, storageType} = this.props;

        return (
            <div className={b('table-wrapper')}>
                {storageType === StorageTypes.groups && (
                    <StorageGroups
                        visibleEntities={visibleEntities}
                        data={flatListStorageEntities}
                        tableSettings={tableSettings}
                        nodes={nodes}
                        onShowAll={() => this.onGroupVisibilityChange(VisibleEntities.All)}
                    />
                )}
                {storageType === StorageTypes.nodes && (
                    <StorageNodes
                        visibleEntities={visibleEntities}
                        data={flatListStorageEntities}
                        tableSettings={tableSettings}
                        onShowAll={() => this.onGroupVisibilityChange(VisibleEntities.All)}
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

    renderEntitiesCount() {
        const {
            storageType,
            groupsCount,
            nodesCount,
            flatListStorageEntities,
            loading,
            wasLoaded,
        } = this.props;

        let label = `${storageType === StorageTypes.groups ? 'Groups' : 'Nodes'}: `;
        const count = storageType === StorageTypes.groups ? groupsCount : nodesCount;

        if (loading && !wasLoaded) {
            label += '...';
            return label;
        }

        // count.total can be missing in old versions
        if (flatListStorageEntities.length === Number(count.total) || !count.total) {
            label += flatListStorageEntities.length;
        } else {
            label += `${flatListStorageEntities.length} of ${count.total}`;
        }

        return label;
    }

    renderControls() {
        const {
            filter,
            setStorageFilter,
            visibleEntities,
            storageType,
            usageFilter,
            setUsageFilter,
            usageFilterOptions,
        } = this.props;

        return (
            <div className={b('controls')}>
                <div className={b('search')}>
                    <StorageFilter
                        placeholder={storageType === StorageTypes.groups ? 'Group ID, Pool name' : 'Node ID, FQDN'}
                        onChange={setStorageFilter}
                        value={filter}
                    />
                </div>
                <RadioButton value={visibleEntities} onUpdate={this.onGroupVisibilityChange}>
                    <RadioButton.Option value={VisibleEntities.Missing}>
                        {VisibleEntitiesTitles[VisibleEntities.Missing]}
                    </RadioButton.Option>
                    <RadioButton.Option value={VisibleEntities.Space}>
                        {VisibleEntitiesTitles[VisibleEntities.Space]}
                    </RadioButton.Option>
                    <RadioButton.Option value={VisibleEntities.All}>
                        {VisibleEntitiesTitles[VisibleEntities.All]}
                    </RadioButton.Option>
                </RadioButton>

                <RadioButton value={storageType} onUpdate={this.onStorageTypeChange}>
                    <RadioButton.Option value={StorageTypes.groups}>
                        {StorageTypes.groups}
                    </RadioButton.Option>
                    <RadioButton.Option value={StorageTypes.nodes}>
                        {StorageTypes.nodes}
                    </RadioButton.Option>
                </RadioButton>

                {storageType === StorageTypes.groups && (
                    <UsageFilter
                        value={usageFilter}
                        onChange={setUsageFilter}
                        groups={usageFilterOptions}
                        disabled={usageFilterOptions.length === 0}
                    />
                )}

                <Label theme="info" size="m">
                    {this.renderEntitiesCount()}
                </Label>
            </div>
        );
    }

    render() {
        const {loading, wasLoaded, error} = this.props;
        const showLoader = loading && !wasLoaded;

        return (
            <div className={b()}>
                {this.renderControls()}
                {error && (
                    <div>{error.statusText}</div>
                )}
                {showLoader ? (
                    this.renderLoader()
                ) : (
                    this.renderDataTable()
                )}
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
    } = state.storage;

    return {
        flatListStorageEntities: getFilteredEntities(state),
        groupsCount: getStoragePoolsGroupsCount(state),
        autorefresh: state.schema.autorefresh,
        nodes: getNodesObject(state),
        nodesCount: getStorageNodesCount(state),
        loading,
        wasLoaded,
        error,
        visibleEntities,
        storageType,
        filter,
        usageFilter,
        usageFilterOptions: getUsageFilterOptions(state),
    };
}

const mapDispatchToProps = {
    getStorageInfo,
    setInitialState,
    setStorageFilter,
    setUsageFilter,
    setVisibleEntities: setVisibleEntities,
    getNodesList,
    setStorageType,
    setHeader,
};

export default connect(mapStateToProps, mapDispatchToProps)(Storage);
