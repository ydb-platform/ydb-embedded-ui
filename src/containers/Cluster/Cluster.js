import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';

import {getClusterInfo} from '../../store/reducers/cluster';
import {clusterName} from '../../store';
import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';

import {Loader} from '@yandex-cloud/uikit';
import ClusterInfo from '../../components/ClusterInfo/ClusterInfo';
import Tenants from '../Tenants/Tenants';
import Nodes from '../Nodes/Nodes';
import Storage from '../StorageV2/Storage';

import './Cluster.scss';

const b = cn('cluster');

export const CLUSTER_PAGES = {
    tenants: {id: 'tenants', name: 'Databases'},
    nodes: {id: 'nodes', name: 'Nodes'},
    storage: {id: 'storage', name: 'Storage'},
};

export class AutoFetcher {
    constructor() {
        this.timeout = AutoFetcher.DEFAULT_TIMEOUT;
        this.active = true;
        this.timer = undefined;
    }
    static DEFAULT_TIMEOUT = 30000;
    static MIN_TIMEOUT = 30000;
    wait(ms) {
        return new Promise((resolve) => {
            this.timer = setTimeout(resolve, ms);
            return;
        });
    }
    async fetch(request) {
        if (!this.active) {
            return;
        }

        await this.wait(this.timeout);

        if (this.active) {
            const startTs = Date.now();
            await request();
            const finishTs = Date.now();

            const responseTime = finishTs - startTs;
            const nextTimeout =
                responseTime > AutoFetcher.MIN_TIMEOUT ? responseTime : AutoFetcher.MIN_TIMEOUT;
            this.timeout = nextTimeout;

            this.fetch(request);
        } else {
            return;
        }
    }
    stop() {
        clearTimeout(this.timer);
        this.active = false;
    }
    start() {
        this.active = true;
    }
}

class Cluster extends React.Component {
    static propTypes = {
        activeTab: PropTypes.string,
        getClusterInfo: PropTypes.func,
        cluster: PropTypes.object,
        error: PropTypes.object,
        loading: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        showTooltip: PropTypes.func,
        hideTooltip: PropTypes.func,
        additionalClusterInfo: PropTypes.array,
        additionalTenantsInfo: PropTypes.object,
        additionalNodesInfo: PropTypes.object,
    };
    componentDidMount() {
        this.props.getClusterInfo(clusterName);
        this.autofetcher = new AutoFetcher();
        this.autofetcher.fetch(() => this.props.getClusterInfo(clusterName));
    }
    componentDidCatch(error, info) {
        console.log(error);
        console.log(info);
    }
    componentWillUnmount() {
        this.autofetcher.stop();
    }
    renderLoader() {
        return (
            <div className="loader">
                <Loader size="l" />
            </div>
        );
    }
    renderTabContent() {
        const {activeTab} = this.props;
        switch (activeTab) {
            case CLUSTER_PAGES.tenants.id: {
                return <Tenants {...this.props} />;
            }
            case CLUSTER_PAGES.nodes.id: {
                return <Nodes {...this.props} />;
            }
            case CLUSTER_PAGES.storage.id: {
                return <Storage {...this.props} />;
            }
            default: {
                return null;
            }
        }
    }
    renderContent = () => {
        const {cluster} = this.props;

        return (
            <div className={b()}>
                <ClusterInfo
                    cluster={cluster}
                    showTooltip={this.props.showTooltip}
                    hideTooltip={this.props.hideTooltip}
                    additionalInfo={this.props.additionalClusterInfo}
                />
                {this.renderTabContent()}
            </div>
        );
    };

    render() {
        const {error, loading, wasLoaded} = this.props;

        if (loading && !wasLoaded) {
            return this.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        }
        return this.renderContent();
    }
}

const mapStateToProps = (state, ownProps) => {
    const {data: cluster, loading, error, wasLoaded} = state.cluster;
    const {activeTab = CLUSTER_PAGES.tenants.id} = ownProps.match.params;

    return {
        activeTab,
        cluster,
        loading,
        wasLoaded,
        error,
    };
};

const mapDispatchToProps = {
    getClusterInfo,
    hideTooltip,
    showTooltip,
};

export default connect(mapStateToProps, mapDispatchToProps)(Cluster);
