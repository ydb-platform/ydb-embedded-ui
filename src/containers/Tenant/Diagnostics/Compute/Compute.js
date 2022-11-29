import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {Loader} from '@gravity-ui/uikit';

import NodesViewer from '../../../NodesViewer/NodesViewer';

import {backend} from '../../../../store';
import {hideTooltip, showTooltip} from '../../../../store/reducers/tooltip';
import {getNodes, clearNodes, setDataWasNotLoaded} from '../../../../store/reducers/nodes';

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
        setDataWasNotLoaded: PropTypes.func,
        getNodes: PropTypes.func,
        hideTooltip: PropTypes.func,
        showTooltip: PropTypes.func,
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
        const {autorefresh, getNodes, setDataWasNotLoaded, tenantName} = this.props;

        const restartAutorefresh = () => {
            this.autofetcher.stop();
            this.autofetcher.start();
            this.autofetcher.fetch(() => getNodes(tenantName));
        };

        if (tenantName !== prevProps.tenantName) {
            setDataWasNotLoaded();
            getNodes(tenantName);
            if (autorefresh) {
                restartAutorefresh();
            }
        }

        if (autorefresh && !prevProps.autorefresh) {
            getNodes(tenantName);
            restartAutorefresh();
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
    const {data, loading, wasLoaded, error} = state.nodes;
    const {autorefresh} = state.schema;
    const nodes = (data && data.Tenants && data.Tenants[0] && data.Tenants[0].Nodes) || [];
    return {
        ...ownProps,
        nodes,
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
    setDataWasNotLoaded,
};

const ConnectedCompute = connect(mapStateToProps, mapDispatchToProps)(Compute);

export default ConnectedCompute;
