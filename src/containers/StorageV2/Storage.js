import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import DataTable from '@yandex-cloud/react-data-table';
import {Loader, RadioButton, Label} from '@yandex-cloud/uikit';

import StorageFilter from './StorageFilter/StorageFilter';
import {AutoFetcher} from '../Cluster/Cluster';

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
} from '../../store/reducers/storage';
import {getNodesList} from '../../store/reducers/clusterNodes';
import StorageGroups from './StorageGroups/StorageGroups';
import StorageNodes from './StorageNodes/StorageNodes';

import './Storage.scss';

const b = cn('global-storage');

const FILTER_OPTIONS = {
    Missing: 'missing',
    Space: 'space',
};

const tableSettings = {
    displayIndices: false,
    stickyHead: DataTable.MOVING,
    syncHeadOnResize: true,
    dynamicRender: true,
    defaultOrder: DataTable.DESCENDING,
    stripedRows: true,
    stickyTop: 68,
};

class Storage extends React.Component {
    static propTypes = {
        loading: PropTypes.bool,
        error: PropTypes.object,
        wasLoaded: PropTypes.bool,
        getStorageInfo: PropTypes.func,
        setInitialState: PropTypes.func,
        flatListStorageEntities: PropTypes.array,
        setStorageFilter: PropTypes.func,
        setVisibleEntities: PropTypes.func,
        visibleEntities: PropTypes.string,
    };

    componentDidMount() {
        const {tenant, nodeId, setVisibleEntities, storageType} = this.props;
        this.autofetcher = new AutoFetcher();
        this.props.getNodesList();
        if (tenant || nodeId) {
            setVisibleEntities(VisibleEntities.All);
        } else {
            this.props.getStorageInfo({
                tenant,
                nodeId,
                filter: FILTER_OPTIONS.Missing,
                type: storageType,
            });
            this.autofetcher.fetch(() =>
                this.props.getStorageInfo({
                    tenant,
                    nodeId,
                    filter: FILTER_OPTIONS.Missing,
                    type: storageType,
                }),
            );
        }
    }

    componentDidUpdate(prevProps) {
        const {tenant, visibleEntities, getStorageInfo, nodeId, storageType} = this.props;
        if (
            storageType !== prevProps.storageType ||
            visibleEntities !== prevProps.visibleEntities
        ) {
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

            getStorageInfo({
                tenant,
                filter: FILTER_OPTIONS[visibleEntities],
                nodeId,
                type: storageType,
            });
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
        this.props.setInitialState();
    }

    renderLoader() {
        return (
            <div className={b('loader')}>
                <Loader size="l" />
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
                <div className={b('filter')}>
                    <StorageFilter
                        changeReduxStorageFilter={setStorageFilter}
                        storageType={storageType}
                    />
                </div>
                <RadioButton
                    value={visibleEntities}
                    onUpdate={this.onGroupVisibilityChange}
                    className={b('control')}
                >
                    <RadioButton.Option value={VisibleEntities.Missing}>
                        {VisibleEntities.Missing}
                    </RadioButton.Option>
                    <RadioButton.Option value={VisibleEntities.Space}>
                        {VisibleEntities.Space}
                    </RadioButton.Option>
                    <RadioButton.Option value={VisibleEntities.All}>
                        {VisibleEntities.All}
                    </RadioButton.Option>
                </RadioButton>

                <RadioButton
                    value={storageType}
                    onUpdate={this.onStorageTypeChange}
                    className={b('control')}
                >
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
};

export default connect(mapStateToProps, mapDispatchToProps)(Storage);
