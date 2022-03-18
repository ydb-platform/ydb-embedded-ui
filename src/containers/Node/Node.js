import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import _ from 'lodash';

import {Loader, Tabs} from '@yandex-cloud/uikit';
import {withRouter, Link} from 'react-router-dom';

import {TABLETS, STORAGE, NODE_PAGES, OVERVIEW, STRUCTURE} from './NodePages';
import Tablets from '../Tablets/Tablets';
import Storage from '../Storage/Storage';
import NodeOverview from './NodeOverview/NodeOverview';
import NodeStructure from './NodeStructure/NodeStructure';

import {getNodeInfo, resetNode} from '../../store/reducers/node';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';
import {setHeader} from '../../store/reducers/header';
import {AutoFetcher} from '../../utils/autofetcher';

import './Node.scss';

const b = cn('node');

export const STORAGE_ROLE = 'Storage';

const headerNodes = {
    text: CLUSTER_PAGES.nodes.title,
    link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.nodes.id}),
};

class Node extends React.Component {
    static renderLoader() {
        return (
            <div className={'loader'}>
                <Loader size="l" />
            </div>
        );
    }

    static propTypes = {
        className: PropTypes.string,
        getNodeInfo: PropTypes.func,
        match: PropTypes.object,
        loading: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        error: PropTypes.bool,
        node: PropTypes.object,
        activeTab: PropTypes.string,
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        additionalNodesInfo: PropTypes.object,
    };

    static defaultProps = {
        className: '',
    };

    state = {
        activeTab: '',
    };

    componentDidMount() {
        const {setHeader} = this.props;
        this.setState({activeTab: this.props.activeTab});
        this.fetchData();
        this.autofetcher = new AutoFetcher();
        this.autofetcher.fetch(() => this.fetchData());
        setHeader([headerNodes]);
    }

    componentDidUpdate(prevProps) {
        const prevId = prevProps.match.params.id;
        const {id} = this.props.match.params;
        const {resetNode} = this.props;
        if (prevId !== id) {
            resetNode();
            this.fetchData();
            this.autofetcher.stop();
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.fetchData());
        }
        const {node, setHeader} = this.props;
        let {activeTab} = this.props;
        if (node) {
            const hasStorage = _.find(node.Roles, (el) => el === STORAGE_ROLE);
            if (!hasStorage) {
                activeTab = OVERVIEW;
            }
            this.setState((prev) => {
                if (prev.activeTab !== activeTab) {
                    return {activeTab};
                }
            });
            setHeader([
                headerNodes,
                {
                    text: node.Host,
                },
            ]);
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
    }

    fetchData = () => {
        const {id} = this.props.match.params;
        const {getNodeInfo} = this.props;
        getNodeInfo(id);
    };

    renderTabs() {
        const {node} = this.props;
        const {id} = this.props.match.params;
        const hasStorage = _.find(node?.Roles, (el) => el === STORAGE_ROLE);

        const filteredNodesPages = hasStorage
            ? NODE_PAGES
            : NODE_PAGES.filter((el) => el.id !== STORAGE);
        const pages = filteredNodesPages.map((page) => {
            return {
                ...page,
                path: createHref(routes.node, {id, activeTab: page.id}),
            };
        });

        return (
            <div className={b('tabs')}>
                <Tabs
                    items={pages}
                    activeTab={this.state.activeTab}
                    wrapTo={({path, id}, node) => (
                        <Link to={path} key={id} className={b('tab')}>
                            {node}
                        </Link>
                    )}
                    allowNotSelected={true}
                />
            </div>
        );
    }
    renderTabContent() {
        const {activeTab} = this.state;
        const {id} = this.props.match.params;
        const {additionalNodesInfo, node} = this.props;

        switch (activeTab) {
            case STORAGE: {
                return (
                    <div className={b('storage')}>
                        <Storage nodeId={id} />
                    </div>
                );
            }
            case TABLETS: {
                return <Tablets nodeId={id} className={b('node-page-wrapper')} />;
            }

            case OVERVIEW: {
                return (
                    <NodeOverview
                        additionalNodesInfo={additionalNodesInfo}
                        node={node}
                        className={b('overview-wrapper')}
                    />
                );
            }

            case STRUCTURE: {
                return (
                    <NodeStructure
                        className={b('node-page-wrapper')}
                        nodeId={id}
                        additionalNodesInfo={additionalNodesInfo}
                    />
                );
            }
            default:
                return false;
        }
    }

    render() {
        const {className, loading, wasLoaded, error, node} = this.props;

        if (loading && !wasLoaded) {
            return Node.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            if (node) {
                return (
                    <div className={`${b()} ${className}`}>
                        {this.renderTabs()}

                        <div className={b('content')}>{this.renderTabContent()}</div>
                    </div>
                );
            }
            return <div className="error">no node data</div>;
        }
    }
}

const mapStateToProps = (state, ownProps) => {
    const {wasLoaded, loading} = state.node;
    const {activeTab} = ownProps.match.params;
    let {data: node} = state.node;

    if (node) {
        node = node.SystemStateInfo ? node.SystemStateInfo[0] : undefined;
    }

    return {
        node,
        activeTab,
        wasLoaded,
        loading,
    };
};

const mapDispatchToProps = {
    getNodeInfo,
    setHeader,
    resetNode,
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Node));
