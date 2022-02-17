import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import _ from 'lodash';

import {Loader, Tabs} from '@yandex-cloud/uikit';
import {withRouter, Link} from 'react-router-dom';

import FullNodeViewer from '../../components/FullNodeViewer/FullNodeViewer';
import {TABLETS, STORAGE, NODE_PAGES} from './NodePages';
import Tablets from '../Tablets/Tablets';
import Storage from '../StorageV2/Storage';

import {getNodeInfo} from '../../store/reducers/node';
import {NODE_AUTO_RELOAD_INTERVAL} from '../../utils/constants';
import routes, {createHref} from '../../routes';
import {backend} from '../../store';

import './Node.scss';

const b = cn('node');

export const STORAGE_ROLE = 'Storage';

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
        const {id} = this.props.match.params;
        this.setState({activeTab: this.props.activeTab});
        this.props.getNodeInfo(id);
        this.reloadDescriptor = setInterval(
            () => this.props.getNodeInfo(id),
            NODE_AUTO_RELOAD_INTERVAL,
        );
    }

    componentDidUpdate() {
        const {node} = this.props;
        let {activeTab} = this.props;
        if (node) {
            const hasStorage = _.find(node.Roles, (el) => el === STORAGE_ROLE);
            if (!hasStorage) {
                activeTab = TABLETS;
            }
            this.setState((prev) => {
                if (prev.activeTab !== activeTab) {
                    return {activeTab};
                }
            });
        }
    }

    componentWillUnmount() {
        clearInterval(this.reloadDescriptor);
    }

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

        switch (activeTab) {
            case STORAGE: {
                return (
                    <div className={b('storage')}>
                        <Storage nodeId={id} />
                    </div>
                );
            }
            case TABLETS: {
                return <Tablets nodeId={id} />;
            }
            default:
                return false;
        }
    }

    render() {
        const {className, loading, wasLoaded, error, node, additionalNodesInfo} = this.props;

        if (loading && !wasLoaded) {
            return Node.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            if (node) {
                return (
                    <div className={`${b()} ${className}`}>
                        <FullNodeViewer
                            node={node}
                            backend={backend}
                            additionalNodesInfo={additionalNodesInfo}
                        />
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
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Node));
