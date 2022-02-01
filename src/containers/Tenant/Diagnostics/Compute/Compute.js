import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import qs from 'qs';

import {Loader} from '@yandex-cloud/uikit';

import NodesViewer from '../../../../components/NodesViewer/NodesViewer';

import {backend} from '../../../../store';
import {hideTooltip, showTooltip} from '../../../../store/reducers/tooltip';
import {getNodes, clearNodes} from '../../../../store/reducers/nodes';

import './Compute.scss';
import {AutoFetcher} from '../../../../utils/autofetcher';

const b = cn('compute');

class Compute extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        clearNodes: PropTypes.func,
        tenantName: PropTypes.string,
        nodes: PropTypes.object,
        loading: PropTypes.bool,
        autorefresh: PropTypes.bool,
        error: PropTypes.object,
        wasLoaded: PropTypes.bool,
        getNodes: PropTypes.func,
        hideTooltip: PropTypes.func,
        showTooltip: PropTypes.func,
        timeoutForRequest: PropTypes.number,
    };

    autofetcher;

    componentDidMount() {
        const {getNodes, tenantName, autorefresh} = this.props;

        this.autofetcher = new AutoFetcher();

        if (tenantName) {
            getNodes(tenantName);
            if (autorefresh) {
                this.autofetcher.start();
                this.autofetcher.fetch(() => getNodes(tenantName));
            }
        }
    }

    componentDidUpdate(prevProps) {
        const {autorefresh, getNodes, tenantName} = this.props;

        if (autorefresh && !prevProps.autorefresh) {
            getNodes(tenantName);
            this.autofetcher.start();
            this.autofetcher.fetch(() => getNodes(tenantName));
        }
        if (!autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }
    }

    componentWillUnmount() {
        this.props.clearNodes();
        this.autofetcher.stop();
    }

    renderLoader() {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    }

    render() {
        const {nodes, error, tenantName, wasLoaded, loading} = this.props;
        if (!tenantName) {
            return <div className="error">no tenant name in the query string</div>;
        } else if (loading && !wasLoaded) {
            return this.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            return (
                <div className={b()}>
                    <NodesViewer
                        backend={backend}
                        nodes={nodes}
                        path={tenantName}
                        hideTooltip={this.props.hideTooltip}
                        showTooltip={this.props.showTooltip}
                        additionalNodesInfo={this.props.additionalNodesInfo}
                    />
                </div>
            );
        }
    }
}

function mapStateToProps(state, ownProps) {
    const {data, loading, wasLoaded, error, timeoutForRequest} = state.nodes;
    const {autorefresh} = state.schema;
    const {search} = ownProps.location;
    const queryParams = qs.parse(search, {
        ignoreQueryPrefix: true,
    });
    const {name: tenantName} = queryParams;
    const nodes = (data && data.Tenants && data.Tenants[0] && data.Tenants[0].Nodes) || [];
    return {
        nodes,
        tenantName,
        timeoutForRequest,
        loading,
        wasLoaded,
        error,
        autorefresh,
    };
}

const mapDispatchToProps = {
    getNodes,
    clearNodes,
    hideTooltip,
    showTooltip,
};

const ConnectedCompute = connect(mapStateToProps, mapDispatchToProps)(Compute);

export default withRouter(ConnectedCompute);
