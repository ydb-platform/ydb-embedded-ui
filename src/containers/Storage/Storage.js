import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import DataTable from '@yandex-cloud/react-data-table';
import {Loader, RadioButton, Label} from '@yandex-cloud/uikit';

import StorageFilter from './StorageFilter/StorageFilter';
import {AutoFetcher} from '../../utils/autofetcher';

import {
    getStorageInfo,
    setInitialState,
    getFilteredEntities,
    VisibleEntities,
    setVisibleEntities,
    setStorageFilter,
    getNodesObject,
    StorageTypes,
    setStorageType,
    VisibleEntitiesTitles,
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
    stickyTop: 62,
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
            getStorageInfo,
        } = this.props;

        this.autofetcher = new AutoFetcher();
        getNodesList();
        if (tenant || nodeId) {
            setVisibleEntities(VisibleEntities.All);
            getStorageInfo({
                tenant,
                filter: FILTER_OPTIONS.All,
                nodeId,
                type: storageType,
            });
        } else {
            setHeader([
                {
                    text: CLUSTER_PAGES.storage.title,
                    link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.storage.id}),
                },
            ]);
            getStorageInfo({
                tenant,
                nodeId,
                filter: FILTER_OPTIONS.Missing,
                type: storageType,
            });
            this.autofetcher.fetch(() =>
                getStorageInfo({
                    tenant,
                    nodeId,
                    filter: FILTER_OPTIONS.Missing,
                    type: storageType,
                }),
            );
        }
    }

    componentDidUpdate(prevProps) {
        const {
            tenant,
            visibleEntities,
            getStorageInfo,
            nodeId,
            storageType,
            autorefresh,
            database,
        } = this.props;

        const startFetch = () => {
            getStorageInfo({
                tenant,
                filter: FILTER_OPTIONS[visibleEntities],
                nodeId,
                type: storageType,
            });

            this.autofetcher.stop();
            this.autofetcher.start();
            this.autofetcher.fetch(() =>
                getStorageInfo({
                    tenant,
                    filter: FILTER_OPTIONS[visibleEntities],
                    nodeId,
                    type: storageType,
                }),
            );
        };

        if (database && !autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }
        if (database && autorefresh && !prevProps.autorefresh) {
            startFetch();
        }

        if (
            (storageType !== prevProps.storageType ||
                visibleEntities !== prevProps.visibleEntities) &&
            (!database || (database && autorefresh))
        ) {
            startFetch();
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
        this.props.setInitialState();
    }

    renderLoader() {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
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
                    />
                )}
                {storageType === StorageTypes.nodes && (
                    <StorageNodes
                        visibleEntities={visibleEntities}
                        data={flatListStorageEntities}
                        tableSettings={tableSettings}
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

    renderControls() {
        const {setStorageFilter, visibleEntities, storageType, flatListStorageEntities} =
            this.props;
        return (
            <div className={b('controls')}>
                <div className={b('search')}>
                    <StorageFilter
                        changeReduxStorageFilter={setStorageFilter}
                        storageType={storageType}
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
                <Label theme="info" size="m">{`${
                    storageType === StorageTypes.groups ? 'Groups' : 'Nodes'
                }: ${flatListStorageEntities.length}`}</Label>
            </div>
        );
    }

    render() {
        const {loading, wasLoaded, error} = this.props;
        if (loading && !wasLoaded) {
            return this.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            return (
                <div className={b()}>
                    {this.renderControls()}
                    {this.renderDataTable()}
                </div>
            );
        }
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
    } = state.storage;

    return {
        flatListStorageEntities: getFilteredEntities(state),
        autorefresh: state.schema.autorefresh,
        nodes: getNodesObject(state),
        loading,
        wasLoaded,
        error,
        visibleEntities,
        storageType,
        filter,
    };
}

const mapDispatchToProps = {
    getStorageInfo,
    setInitialState,
    setStorageFilter,
    setVisibleEntities: setVisibleEntities,
    getNodesList,
    setStorageType,
    setHeader,
};

export default connect(mapStateToProps, mapDispatchToProps)(Storage);
