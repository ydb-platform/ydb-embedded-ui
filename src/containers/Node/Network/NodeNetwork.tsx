import React from 'react';

import {Checkbox, Icon, Loader} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Illustration} from '../../../components/Illustration';
import {ProblemFilter} from '../../../components/ProblemFilter';
import {networkApi} from '../../../store/reducers/network/network';
import {
    ProblemFilterValues,
    changeFilter,
    selectProblemFilter,
} from '../../../store/reducers/settings/settings';
import {hideTooltip, showTooltip} from '../../../store/reducers/tooltip';
import type {TNetNodeInfo, TNetNodePeerInfo} from '../../../types/api/netInfo';
import {cn} from '../../../utils/cn';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {getDefaultNodePath} from '../NodePages';

import {NodeNetwork as NodeNetworkComponent} from '../../../containers/Tenant/Diagnostics/Network/NodeNetwork/NodeNetwork';
import {getConnectedNodesCount} from '../../../containers/Tenant/Diagnostics/Network/utils';

import networkIcon from '../../../assets/icons/network.svg';

import './NodeNetwork.scss';

const b = cn('node-network');

interface NodeNetworkProps {
    nodeId: string;
    tenantName?: string;
}

export function NodeNetwork({nodeId, tenantName}: NodeNetworkProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filter = useTypedSelector(selectProblemFilter);
    const dispatch = useTypedDispatch();

    const [showId, setShowId] = React.useState(false);
    const [showRacks, setShowRacks] = React.useState(false);

    const {currentData, isFetching, error} = networkApi.useGetNetworkInfoQuery(
        tenantName || 'unknown',
        {
            pollingInterval: autoRefreshInterval,
        },
    );
    const loading = isFetching && currentData === undefined;

    if (loading) {
        return (
            <div className="loader">
                <Loader size="l" />
            </div>
        );
    }

    const netWorkInfo = currentData;
    const allNodes = (netWorkInfo?.Tenants && netWorkInfo.Tenants[0].Nodes) ?? [];
    
    // Find the current node and its peers
    const currentNode = allNodes.find((node) => node.NodeId.toString() === nodeId);
    const peers = currentNode?.Peers ?? [];

    if (!error && !currentNode) {
        return <div className="error">No network data found for node {nodeId}</div>;
    }

    if (!error && allNodes.length === 0) {
        return <div className="error">No nodes data</div>;
    }

    // Group current node by type for consistent display
    const currentNodeGrouped: Record<string, TNetNodeInfo[]> = currentNode
        ? {[currentNode.NodeType]: [currentNode]}
        : {};

    // Group peers by type
    const peersGrouped = groupNodesByField(peers, 'NodeType');

    return (
        <div className={b()}>
            {error ? <ResponseError error={error} /> : null}
            {currentNode ? (
                <div className={b('inner')}>
                    <div className={b('controls-wrapper')}>
                        <div className={b('controls')}>
                            <ProblemFilter
                                value={filter}
                                onChange={(v) => {
                                    dispatch(changeFilter(v));
                                }}
                                className={b('problem-filter')}
                            />
                            <div className={b('checkbox-wrapper')}>
                                <Checkbox
                                    onUpdate={() => {
                                        setShowId(!showId);
                                    }}
                                    checked={showId}
                                >
                                    ID
                                </Checkbox>
                            </div>
                            <div className={b('checkbox-wrapper')}>
                                <Checkbox
                                    onUpdate={() => {
                                        setShowRacks(!showRacks);
                                    }}
                                    checked={showRacks}
                                >
                                    Racks
                                </Checkbox>
                            </div>
                        </div>
                    </div>
                    
                    <div className={b('nodes-row')}>
                        <div className={b('left')}>
                            <div className={b('section-title')}>Current Node</div>
                            <Nodes
                                nodes={currentNodeGrouped}
                                showId={showId}
                                showRacks={showRacks}
                                filter={filter}
                                dispatch={dispatch}
                                isCurrentNode={true}
                            />
                        </div>

                        <div className={b('right')}>
                            {peers.length > 0 ? (
                                <div>
                                    <div className={b('section-title')}>
                                        Network peers of node{' '}
                                        <Link
                                            className={b('link')}
                                            to={getDefaultNodePath(currentNode.NodeId)}
                                        >
                                            {currentNode.NodeId}
                                        </Link>
                                    </div>
                                    <div className={b('nodes-row')}>
                                        <Nodes
                                            nodes={peersGrouped}
                                            showId={showId}
                                            showRacks={showRacks}
                                            filter={filter}
                                            dispatch={dispatch}
                                            isCurrentNode={false}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className={b('placeholder')}>
                                    <div className={b('placeholder-img')}>
                                        <Icon data={networkIcon} width={221} height={204} />
                                    </div>
                                    <div className={b('placeholder-text')}>
                                        No network peers found for this node
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

interface NodesProps {
    nodes: Record<string, (TNetNodeInfo | TNetNodePeerInfo)[]>;
    showId?: boolean;
    showRacks?: boolean;
    filter: ProblemFilterValues;
    dispatch: ReturnType<typeof useTypedDispatch>;
    isCurrentNode: boolean;
}

function Nodes({nodes, showId, showRacks, filter, dispatch, isCurrentNode}: NodesProps) {
    let problemNodesCount = 0;
    
    const result = Object.keys(nodes).map((key, j) => {
        const nodesGroupedByRack = groupNodesByField(nodes[key], 'Rack');
        return (
            <div key={j} className={b('nodes-container')}>
                <div className={b('nodes-title')}>{key} nodes</div>
                <div className={b('nodes')}>
                    {showRacks
                        ? Object.keys(nodesGroupedByRack).map((rackKey, i) => (
                              <div key={i} className={b('rack-column')}>
                                  <div className={b('rack-index')}>
                                      {rackKey === 'undefined' ? '?' : rackKey}
                                  </div>
                                  {nodesGroupedByRack[rackKey].map((nodeInfo, index) => {
                                      let capacity, connected;
                                      if ('Peers' in nodeInfo && nodeInfo.Peers) {
                                          capacity = nodeInfo.Peers.length;
                                          connected = getConnectedNodesCount(nodeInfo.Peers);
                                      }

                                      if (
                                          (filter === ProblemFilterValues.PROBLEMS &&
                                              capacity !== connected) ||
                                          filter === ProblemFilterValues.ALL
                                      ) {
                                          problemNodesCount++;
                                          return (
                                              <NodeNetworkComponent
                                                  key={index}
                                                  nodeId={nodeInfo.NodeId}
                                                  showID={showId}
                                                  rack={nodeInfo.Rack}
                                                  status={
                                                      'ConnectStatus' in nodeInfo
                                                          ? nodeInfo.ConnectStatus
                                                          : undefined
                                                  }
                                                  capacity={capacity}
                                                  connected={connected}
                                                  onMouseEnter={(...params) => {
                                                      dispatch(showTooltip(...params));
                                                  }}
                                                  onMouseLeave={() => {
                                                      dispatch(hideTooltip());
                                                  }}
                                                  onClick={undefined}
                                                  isBlurred={false}
                                              />
                                          );
                                      }
                                      return null;
                                  })}
                              </div>
                          ))
                        : nodes[key].map((nodeInfo, index) => {
                              let capacity, connected;
                              if ('Peers' in nodeInfo && nodeInfo.Peers) {
                                  capacity = nodeInfo.Peers.length;
                                  connected = getConnectedNodesCount(nodeInfo.Peers);
                              }

                              if (
                                  (filter === ProblemFilterValues.PROBLEMS &&
                                      capacity !== connected) ||
                                  filter === ProblemFilterValues.ALL
                              ) {
                                  problemNodesCount++;
                                  return (
                                      <NodeNetworkComponent
                                          key={index}
                                          nodeId={nodeInfo.NodeId}
                                          showID={showId}
                                          rack={nodeInfo.Rack}
                                          status={
                                              'ConnectStatus' in nodeInfo
                                                  ? nodeInfo.ConnectStatus
                                                  : undefined
                                          }
                                          capacity={capacity}
                                          connected={connected}
                                          onMouseEnter={(...params) => {
                                              dispatch(showTooltip(...params));
                                          }}
                                          onMouseLeave={() => {
                                              dispatch(hideTooltip());
                                          }}
                                          onClick={undefined}
                                          isBlurred={false}
                                      />
                                  );
                              }
                              return null;
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
}

function groupNodesByField<T extends Pick<TNetNodeInfo | TNetNodePeerInfo, 'NodeType' | 'Rack'>>(
    nodes: T[],
    field: 'NodeType' | 'Rack',
) {
    return nodes.reduce<Record<string, T[]>>((acc, node) => {
        const fieldValue = node[field] || 'undefined';
        if (acc[fieldValue]) {
            acc[fieldValue].push(node);
        } else {
            acc[fieldValue] = [node];
        }
        return acc;
    }, {});
}