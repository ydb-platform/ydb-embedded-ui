import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import qs from 'qs';

import {Loader} from '@yandex-cloud/uikit';

import NodesViewer from '../../../components/NodesViewer/NodesViewer';

import {backend} from '../../../store';
import {hideTooltip, showTooltip} from '../../../store/reducers/tooltip';
import {getNodes, clearNodes} from '../../../store/reducers/nodes';
import {AUTO_RELOAD_INTERVAL} from '../../../utils/constants';

import './Compute.scss';

const b = cn('compute');

class Compute extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        clearNodes: PropTypes.func,
        tenantName: PropTypes.string,
        nodes: PropTypes.object,
        loading: PropTypes.bool,
        error: PropTypes.object,
        wasLoaded: PropTypes.bool,
        getNodes: PropTypes.func,
        hideTooltip: PropTypes.func,
        showTooltip: PropTypes.func,
        timeoutForRequest: PropTypes.number,
    };

    componentDidMount() {
        const {getNodes, tenantName} = this.props;

        if (tenantName) {
            getNodes(tenantName);
            this.reloadDescriptor = setInterval(() => getNodes(tenantName), AUTO_RELOAD_INTERVAL);
        }
    }

    componentWillUnmount() {
        this.props.clearNodes();
        clearInterval(this.reloadDescriptor);
    }

    renderLoader() {
        return (
            <div className="loader">
                <Loader size="l" />
            </div>
        );
    }

    render() {
        const {nodes, loading, wasLoaded, error, tenantName} = this.props;
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
    const {search} = ownProps.location;
    const queryParams = qs.parse(search, {
        ignoreQueryPrefix: true,
    });
    const {name: tenantName} = queryParams;
    const nodes = (data && data.Tenants && data.Tenants[0] && data.Tenants[0].Nodes) || {};
    return {
        nodes,
        tenantName,
        timeoutForRequest,
        loading,
        wasLoaded,
        error,
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
