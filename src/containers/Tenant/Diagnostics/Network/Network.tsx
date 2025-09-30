import React from 'react';

import {Checkbox, Icon, Loader} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Illustration} from '../../../../components/Illustration';
import {ProblemFilter} from '../../../../components/ProblemFilter';
import {networkApi} from '../../../../store/reducers/network/network';
import {
    ProblemFilterValues,
    changeFilter,
    selectProblemFilter,
} from '../../../../store/reducers/settings/settings';
import {hideTooltip, showTooltip} from '../../../../store/reducers/tooltip';
import type {TNetNodeInfo, TNetNodePeerInfo} from '../../../../types/api/netInfo';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {getDefaultNodePath} from '../../../Node/NodePages';

import {NodeNetwork} from './NodeNetwork/NodeNetwork';
import {getConnectedNodesCount} from './utils';

import networkIcon from '../../../../assets/icons/network.svg';

import './Network.scss';

const b = cn('network');

interface NetworkProps {
    database: string;
    databaseFullPath: string;
}
export function Network({database, databaseFullPath}: NetworkProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const filter = useTypedSelector(selectProblemFilter);
    const dispatch = useTypedDispatch();

    const [clickedNode, setClickedNode] = React.useState<TNetNodeInfo>();
    const [showId, setShowId] = React.useState(false);
    const [showRacks, setShowRacks] = React.useState(false);

    const {currentData, isFetching, error} = networkApi.useGetNetworkInfoQuery(
        {database, databaseFullPath},
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
    const nodes = (netWorkInfo?.Tenants && netWorkInfo.Tenants[0].Nodes) ?? [];
    if (!error && nodes.length === 0) {
        return <div className="error">no nodes data</div>;
    }

    const nodesGroupedByType = groupNodesByField(nodes, 'NodeType');
    const rightNodes = clickedNode ? groupNodesByField(clickedNode.Peers ?? [], 'NodeType') : {};

    return (
        <div className={b()}>
            {error ? <ResponseError error={error} /> : null}
            {nodes.length > 0 ? (
                <div className={b('inner')}>
                    <div className={b('nodes-row')}>
                        <div className={b('left')}>
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
                            <Nodes
                                nodes={nodesGroupedByType}
                                showId={showId}
                                showRacks={showRacks}
                                clickedNode={clickedNode}
                                onClickNode={setClickedNode}
                            />
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
                                        <Nodes
                                            nodes={rightNodes}
                                            isRight
                                            showId={showId}
                                            showRacks={showRacks}
                                            clickedNode={clickedNode}
                                            onClickNode={setClickedNode}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className={b('placeholder')}>
                                    <div className={b('placeholder-img')}>
                                        <Icon data={networkIcon} width={221} height={204} />
                                    </div>

                                    <div className={b('placeholder-text')}>
                                        Select node to see its connectivity to other nodes
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
    isRight?: boolean;
    showId?: boolean;
    showRacks?: boolean;
    clickedNode?: TNetNodeInfo;
    onClickNode: (node: TNetNodeInfo | undefined) => void;
}
function Nodes({nodes, isRight, showId, showRacks, clickedNode, onClickNode}: NodesProps) {
    const filter = useTypedSelector(selectProblemFilter);
    const dispatch = useTypedDispatch();

    let problemNodesCount = 0;
    const result = Object.keys(nodes).map((key, j) => {
        const nodesGroupedByRack = groupNodesByField(nodes[key], 'Rack');
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
                                  {nodesGroupedByRack[key].map((nodeInfo, index) => {
                                      let capacity, connected;
                                      if (!isRight && 'Peers' in nodeInfo && nodeInfo.Peers) {
                                          capacity = Object.keys(nodeInfo.Peers).length;
                                          connected = getConnectedNodesCount(nodeInfo.Peers);
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
                                                  onClick={
                                                      isRight
                                                          ? undefined
                                                          : () => {
                                                                onClickNode(
                                                                    clickedNode &&
                                                                        nodeInfo.NodeId ===
                                                                            clickedNode.NodeId
                                                                        ? undefined
                                                                        : (nodeInfo as TNetNodeInfo),
                                                                );
                                                            }
                                                  }
                                                  isBlurred={
                                                      !isRight &&
                                                      clickedNode &&
                                                      clickedNode.NodeId !== nodeInfo.NodeId
                                                  }
                                              />
                                          );
                                      }
                                      return null;
                                  })}
                              </div>
                          ))
                        : nodes[key].map((nodeInfo, index) => {
                              let capacity, connected;
                              const peers =
                                  nodeInfo && 'Peers' in nodeInfo ? nodeInfo.Peers : undefined;
                              if (!isRight && 'Peers' in nodeInfo && nodeInfo.Peers) {
                                  capacity = nodeInfo.Peers.length;
                                  connected = getConnectedNodesCount(peers);
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
                                          status={
                                              'ConnectStatus' in nodeInfo
                                                  ? nodeInfo.ConnectStatus
                                                  : undefined
                                          }
                                          capacity={peers?.length}
                                          connected={connected}
                                          onMouseEnter={(...params) => {
                                              dispatch(showTooltip(...params));
                                          }}
                                          onMouseLeave={() => {
                                              dispatch(hideTooltip());
                                          }}
                                          onClick={
                                              isRight
                                                  ? undefined
                                                  : () => {
                                                        onClickNode(
                                                            clickedNode &&
                                                                nodeInfo.NodeId ===
                                                                    clickedNode.NodeId
                                                                ? undefined
                                                                : (nodeInfo as TNetNodeInfo),
                                                        );
                                                    }
                                          }
                                          isBlurred={
                                              !isRight &&
                                              clickedNode &&
                                              clickedNode.NodeId !== nodeInfo.NodeId
                                          }
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
        return <Illustration name="thumbsUp" width={200} />;
    } else {
        return result;
    }
}

function groupNodesByField<T extends Pick<TNetNodeInfo, 'NodeType' | 'Rack'>>(
    nodes: T[],
    field: 'NodeType' | 'Rack',
) {
    return nodes.reduce<Record<string, T[]>>((acc, node) => {
        if (acc[node[field]]) {
            acc[node[field]].push(node);
        } else {
            acc[node[field]] = [node];
        }
        return acc;
    }, {});
}
