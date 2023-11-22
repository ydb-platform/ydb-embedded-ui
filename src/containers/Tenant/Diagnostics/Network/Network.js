import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import _ from 'lodash';

import {Link} from 'react-router-dom';
import {Loader, Checkbox} from '@gravity-ui/uikit';

import NodeNetwork from './NodeNetwork/NodeNetwork';
import {Icon} from '../../../../components/Icon';
import {ProblemFilter} from '../../../../components/ProblemFilter';
import {Illustration} from '../../../../components/Illustration';

import {getNetworkInfo, setDataWasNotLoaded} from '../../../../store/reducers/network/network';
import {hideTooltip, showTooltip} from '../../../../store/reducers/tooltip';
import {changeFilter, ProblemFilterValues} from '../../../../store/reducers/settings/settings';
import {AutoFetcher} from '../../../../utils/autofetcher';
import {getDefaultNodePath} from '../../../Node/NodePages';

import {getConnectedNodesCount} from './utils';

import './Network.scss';

const b = cn('network');

class Network extends React.Component {
    static propTypes = {
        getNetworkInfo: PropTypes.func,
        setDataWasNotLoaded: PropTypes.func,
        netWorkInfo: PropTypes.object,
        hideTooltip: PropTypes.func,
        showTooltip: PropTypes.func,
        error: PropTypes.object,
        wasLoaded: PropTypes.bool,
        loading: PropTypes.bool,
        autorefresh: PropTypes.bool,
        path: PropTypes.string,
        filter: PropTypes.string,
        changeFilter: PropTypes.func,
    };

    static defaultProps = {};

    static renderLoader() {
        return (
            <div className="loader">
                <Loader size="l" />
            </div>
        );
    }

    state = {
        howNodeSeeOtherNodesSortType: '',
        howOthersSeeNodeSortType: '',
        howNodeSeeOtherSearch: '',
        howOtherSeeNodeSearch: '',
        hoveredNode: undefined,
        clickedNode: undefined,
        highlightedNodes: [],
        showId: false,
        showRacks: false,
    };

    autofetcher;

    componentDidMount() {
        const {path, autorefresh, getNetworkInfo} = this.props;
        this.autofetcher = new AutoFetcher();

        if (autorefresh) {
            this.autofetcher.start();
            this.autofetcher.fetch(() => getNetworkInfo(path));
        }

        getNetworkInfo(path);
    }

    componentDidUpdate(prevProps) {
        const {autorefresh, path, setDataWasNotLoaded, getNetworkInfo} = this.props;

        const restartAutorefresh = () => {
            this.autofetcher.stop();
            this.autofetcher.start();
            this.autofetcher.fetch(() => getNetworkInfo(path));
        };

        if (autorefresh && !prevProps.autorefresh) {
            getNetworkInfo(path);
            restartAutorefresh();
        }
        if (!autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }

        if (path !== prevProps.path) {
            setDataWasNotLoaded();
            getNetworkInfo(path);
            restartAutorefresh();
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
    }

    onChange = (field, num) => {
        this.setState({[field]: num});
    };

    handleSortChange = (sortItem) => {
        this.setState({sort: sortItem});
    };

    handleNodeClickWrap = (nodeInfo) => {
        return () => {
            const {clickedNode} = this.state;
            const {NodeId} = nodeInfo;
            if (!clickedNode) {
                this.setState({
                    clickedNode: nodeInfo,
                    rightNodes: this.groupNodesByField(nodeInfo.Peers, 'NodeType'),
                });
            } else if (NodeId === clickedNode.nodeId) {
                this.setState({clickedNode: undefined});
            } else {
                this.setState({
                    clickedNode: nodeInfo,
                    rightNodes: this.groupNodesByField(nodeInfo.Peers, 'NodeType'),
                });
            }
        };
    };

    groupNodesByField = (nodes, field) => {
        return _.reduce(
            nodes,
            (acc, node) => {
                if (!acc[node[field]]) {
                    acc[node[field]] = [node];
                } else {
                    acc[node[field]].push(node);
                }
                return acc;
            },
            {},
        );
    };

    renderNodes = (nodes, isRight) => {
        const {showId, showRacks, clickedNode} = this.state;
        let problemNodesCount = 0;
        const {showTooltip, hideTooltip, filter} = this.props;
        const result = Object.keys(nodes).map((key, j) => {
            const nodesGroupedByRack = this.groupNodesByField(nodes[key], 'Rack');
            return (
                <div key={j} className={b('nodes-container', {right: isRight})}>
                    <div className={b('nodes-title')}>{key} nodes</div>
                    <div className={b('nodes')}>
                        {showRacks
                            ? Object.keys(nodesGroupedByRack).map((key, i) => (
                                  <div key={i} className={b('rack-column')}>
                                      <div className={b('rack-index')}>
                                          {key === 'undefined' ? '?' : key}
                                      </div>
                                      {/* eslint-disable-next-line array-callback-return */}
                                      {nodesGroupedByRack[key].map((nodeInfo, index) => {
                                          let capacity, connected;
                                          if (!isRight && nodeInfo?.Peers) {
                                              capacity = Object.keys(nodeInfo?.Peers).length;
                                              connected = getConnectedNodesCount(nodeInfo?.Peers);
                                          }

                                          if (
                                              (filter === ProblemFilterValues.PROBLEMS &&
                                                  capacity !== connected) ||
                                              filter === ProblemFilterValues.ALL ||
                                              isRight
                                          ) {
                                              problemNodesCount++;
                                              return (
                                                  <NodeNetwork
                                                      key={index}
                                                      nodeId={nodeInfo.NodeId}
                                                      showID={showId}
                                                      rack={nodeInfo.Rack}
                                                      status={nodeInfo.ConnectStatus}
                                                      capacity={capacity}
                                                      connected={connected}
                                                      onMouseEnter={showTooltip}
                                                      onMouseLeave={hideTooltip}
                                                      onClick={
                                                          !isRight &&
                                                          this.handleNodeClickWrap(nodeInfo)
                                                      }
                                                      isBlurred={
                                                          !isRight &&
                                                          clickedNode &&
                                                          clickedNode.NodeId !== nodeInfo.NodeId
                                                      }
                                                  />
                                              );
                                          }
                                      })}
                                  </div>
                              ))
                            : // eslint-disable-next-line array-callback-return
                              nodes[key].map((nodeInfo, index) => {
                                  let capacity, connected;
                                  if (!isRight) {
                                      capacity = nodeInfo?.Peers?.length;
                                      connected = getConnectedNodesCount(nodeInfo?.Peers);
                                  }

                                  if (
                                      (filter === ProblemFilterValues.PROBLEMS &&
                                          capacity !== connected) ||
                                      filter === ProblemFilterValues.ALL ||
                                      isRight
                                  ) {
                                      problemNodesCount++;
                                      return (
                                          <NodeNetwork
                                              key={index}
                                              nodeId={nodeInfo.NodeId}
                                              showID={showId}
                                              rack={nodeInfo.Rack}
                                              status={nodeInfo.ConnectStatus}
                                              capacity={nodeInfo?.Peers && nodeInfo?.Peers.length}
                                              connected={
                                                  nodeInfo?.Peers &&
                                                  getConnectedNodesCount(nodeInfo?.Peers)
                                              }
                                              onMouseEnter={showTooltip}
                                              onMouseLeave={hideTooltip}
                                              onClick={
                                                  !isRight && this.handleNodeClickWrap(nodeInfo)
                                              }
                                              isBlurred={
                                                  !isRight &&
                                                  clickedNode &&
                                                  clickedNode.NodeId !== nodeInfo.NodeId
                                              }
                                          />
                                      );
                                  }
                              })}
                    </div>
                </div>
            );
        });

        if (filter === ProblemFilterValues.PROBLEMS && problemNodesCount === 0) {
            return <Illustration name="thumbsUp" width="200" />;
        } else {
            return result;
        }
    };

    renderContent = () => {
        const {netWorkInfo, filter, changeFilter} = this.props;

        const {showId, showRacks, rightNodes} = this.state;
        const {clickedNode} = this.state;

        const nodes = netWorkInfo.Tenants && netWorkInfo.Tenants[0].Nodes;
        const nodesGroupedByType = this.groupNodesByField(nodes, 'NodeType');

        if (!nodes?.length) {
            return <div className="error">no nodes data</div>;
        }

        return (
            <div className={b()}>
                <div className={b('inner')}>
                    <div className={b('nodes-row')}>
                        <div className={b('left')}>
                            <div className={b('controls-wrapper')}>
                                <div className={b('controls')}>
                                    <ProblemFilter
                                        value={filter}
                                        onChange={changeFilter}
                                        className={b('problem-filter')}
                                    />
                                    <div className={b('checkbox-wrapper')}>
                                        <Checkbox
                                            onUpdate={() => this.onChange('showId', !showId)}
                                            checked={showId}
                                        >
                                            ID
                                        </Checkbox>
                                    </div>
                                    <div className={b('checkbox-wrapper')}>
                                        <Checkbox
                                            onUpdate={() => this.onChange('showRacks', !showRacks)}
                                            checked={showRacks}
                                        >
                                            Racks
                                        </Checkbox>
                                    </div>
                                </div>
                            </div>
                            {this.renderNodes(nodesGroupedByType)}
                        </div>

                        <div className={b('right')}>
                            {clickedNode ? (
                                <div>
                                    <div className={b('label')}>
                                        Connectivity of node{' '}
                                        <Link
                                            className={b('link')}
                                            to={getDefaultNodePath(clickedNode.NodeId)}
                                        >
                                            {clickedNode.NodeId}
                                        </Link>{' '}
                                        to other nodes
                                    </div>
                                    <div className={b('nodes-row')}>
                                        {this.renderNodes(rightNodes, true)}
                                    </div>
                                </div>
                            ) : (
                                <div className={b('placeholder')}>
                                    <div className={b('placeholder-img')}>
                                        <Icon
                                            name="network-placeholder"
                                            viewBox="0 0 221 204"
                                            width={221}
                                            height={204}
                                        />
                                    </div>

                                    <div className={b('placeholder-text')}>
                                        Select node to see its connectivity to other nodes
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const {loading, wasLoaded, error} = this.props;
        if (loading && !wasLoaded) {
            return Network.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            return this.renderContent();
        }
    }
}

const mapStateToProps = (state) => {
    const {wasLoaded, loading, data: netWorkInfo = {}} = state.network;
    const {autorefresh} = state.schema;
    return {
        netWorkInfo,
        wasLoaded,
        loading,
        filter: state.settings.problemFilter,
        autorefresh,
    };
};

const mapDispatchToProps = {
    getNetworkInfo,
    hideTooltip,
    showTooltip,
    changeFilter,
    setDataWasNotLoaded,
};

export default connect(mapStateToProps, mapDispatchToProps)(Network);
