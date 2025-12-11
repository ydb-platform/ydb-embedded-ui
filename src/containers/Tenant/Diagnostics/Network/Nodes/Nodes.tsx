import React from 'react';

import {Illustration} from '../../../../../components/Illustration';
import type {TNetNodeInfo, TNetNodePeerInfo} from '../../../../../types/api/netInfo';
import {cn} from '../../../../../utils/cn';
import {useWithProblemsQueryParam} from '../../../../../utils/hooks/useWithProblemsQueryParam';
import {NodeNetwork} from '../NodeNetwork/NodeNetwork';
import type {NodeTooltipData} from '../NodeTooltipPopup/NodeTooltipPopup';
import i18n from '../i18n';
import {getConnectedNodesCount, groupNodesByField} from '../utils';

const b = cn('network');

export interface NodesProps {
    nodes: Record<string, (TNetNodeInfo | TNetNodePeerInfo)[]>;
    isRight?: boolean;
    showId?: boolean;
    showRacks?: boolean;
    clickedNode?: TNetNodeInfo;
    onClickNode: (node: TNetNodeInfo | undefined) => void;
    onShowNodeTooltip: (anchor: HTMLDivElement, data: NodeTooltipData) => void;
    onHideNodeTooltip: () => void;
}

interface NodeItemProps {
    nodeInfo: TNetNodeInfo | TNetNodePeerInfo;
    index: number;
    isRight?: boolean;
    showId?: boolean;
    clickedNode?: TNetNodeInfo;
    capacity?: number;
    connected?: number;
    onClickNode: (node: TNetNodeInfo | undefined) => void;
    onShowNodeTooltip: (anchor: HTMLDivElement, data: NodeTooltipData) => void;
    onHideNodeTooltip: () => void;
}

function NodeItem({
    nodeInfo,
    index,
    isRight,
    showId,
    clickedNode,
    capacity,
    connected,
    onClickNode,
    onShowNodeTooltip,
    onHideNodeTooltip,
}: NodeItemProps) {
    const handleClick = isRight
        ? undefined
        : () => {
              onClickNode(
                  clickedNode && nodeInfo.NodeId === clickedNode.NodeId
                      ? undefined
                      : (nodeInfo as TNetNodeInfo),
              );
          };

    return (
        <NodeNetwork
            key={index}
            nodeId={nodeInfo.NodeId}
            showID={showId}
            rack={nodeInfo.Rack}
            status={'ConnectStatus' in nodeInfo ? nodeInfo.ConnectStatus : undefined}
            capacity={capacity}
            connected={connected}
            onMouseEnter={onShowNodeTooltip}
            onMouseLeave={onHideNodeTooltip}
            onClick={handleClick}
            isBlurred={!isRight && clickedNode && clickedNode.NodeId !== nodeInfo.NodeId}
        />
    );
}

function getNodeCapacityAndConnected(
    nodeInfo: TNetNodeInfo | TNetNodePeerInfo,
    isRight?: boolean,
    useObjectKeysLength?: boolean,
) {
    let capacity: number | undefined;
    let connected: number | undefined;

    if (!isRight && 'Peers' in nodeInfo && nodeInfo.Peers) {
        capacity = useObjectKeysLength ? Object.keys(nodeInfo.Peers).length : nodeInfo.Peers.length;
        connected = getConnectedNodesCount(nodeInfo.Peers);
    }

    return {capacity, connected};
}

function shouldShowNode(
    withProblems: boolean,
    isRight?: boolean,
    capacity?: number,
    connected?: number,
) {
    return (withProblems && capacity !== connected) || !withProblems || isRight;
}

interface RackColumnProps {
    rackKey: string;
    rackIndex: number;
    nodes: (TNetNodeInfo | TNetNodePeerInfo)[];
    isRight?: boolean;
    showId?: boolean;
    clickedNode?: TNetNodeInfo;
    withProblems: boolean;
    onClickNode: (node: TNetNodeInfo | undefined) => void;
    onShowNodeTooltip: (anchor: HTMLDivElement, data: NodeTooltipData) => void;
    onHideNodeTooltip: () => void;
}

function RackColumn({
    rackKey,
    rackIndex,
    nodes,
    isRight,
    showId,
    clickedNode,
    withProblems,
    onClickNode,
    onShowNodeTooltip,
    onHideNodeTooltip,
}: RackColumnProps) {
    return (
        <div key={rackIndex} className={b('rack-column')}>
            <div className={b('rack-index')}>{rackKey === 'undefined' ? '?' : rackKey}</div>
            {nodes.map((nodeInfo, index) => {
                const {capacity, connected} = getNodeCapacityAndConnected(nodeInfo, isRight, true);

                if (shouldShowNode(withProblems, isRight, capacity, connected)) {
                    return (
                        <NodeItem
                            key={index}
                            nodeInfo={nodeInfo}
                            index={index}
                            isRight={isRight}
                            showId={showId}
                            clickedNode={clickedNode}
                            capacity={capacity}
                            connected={connected}
                            onClickNode={onClickNode}
                            onShowNodeTooltip={onShowNodeTooltip}
                            onHideNodeTooltip={onHideNodeTooltip}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
}

interface FlatNodesListProps {
    nodes: (TNetNodeInfo | TNetNodePeerInfo)[];
    isRight?: boolean;
    showId?: boolean;
    clickedNode?: TNetNodeInfo;
    withProblems: boolean;
    onClickNode: (node: TNetNodeInfo | undefined) => void;
    onShowNodeTooltip: (anchor: HTMLDivElement, data: NodeTooltipData) => void;
    onHideNodeTooltip: () => void;
}

function FlatNodesList({
    nodes,
    isRight,
    showId,
    clickedNode,
    withProblems,
    onClickNode,
    onShowNodeTooltip,
    onHideNodeTooltip,
}: FlatNodesListProps) {
    return (
        <React.Fragment>
            {nodes.map((nodeInfo, index) => {
                const peers = nodeInfo && 'Peers' in nodeInfo ? nodeInfo.Peers : undefined;
                const {capacity, connected} = getNodeCapacityAndConnected(nodeInfo, isRight, false);

                if (shouldShowNode(withProblems, isRight, capacity, connected)) {
                    return (
                        <NodeItem
                            key={index}
                            nodeInfo={nodeInfo}
                            index={index}
                            isRight={isRight}
                            showId={showId}
                            clickedNode={clickedNode}
                            capacity={peers?.length}
                            connected={connected}
                            onClickNode={onClickNode}
                            onShowNodeTooltip={onShowNodeTooltip}
                            onHideNodeTooltip={onHideNodeTooltip}
                        />
                    );
                }
                return null;
            })}
        </React.Fragment>
    );
}

function countDisplayedNodes(
    nodes: NodesProps['nodes'],
    withProblems: boolean,
    isRight?: boolean,
    showRacks?: boolean,
) {
    let count = 0;

    Object.keys(nodes).forEach((nodeTypeKey) => {
        if (showRacks) {
            const nodesGroupedByRack = groupNodesByField(nodes[nodeTypeKey], 'Rack');

            Object.keys(nodesGroupedByRack).forEach((rackKey) => {
                nodesGroupedByRack[rackKey].forEach((nodeInfo) => {
                    const {capacity, connected} = getNodeCapacityAndConnected(
                        nodeInfo,
                        isRight,
                        true,
                    );

                    if (shouldShowNode(withProblems, isRight, capacity, connected)) {
                        count++;
                    }
                });
            });
        } else {
            nodes[nodeTypeKey].forEach((nodeInfo) => {
                const {capacity, connected} = getNodeCapacityAndConnected(nodeInfo, isRight, false);

                if (shouldShowNode(withProblems, isRight, capacity, connected)) {
                    count++;
                }
            });
        }
    });

    return count;
}

export function Nodes({
    nodes,
    isRight,
    showId,
    showRacks,
    clickedNode,
    onClickNode,
    onShowNodeTooltip,
    onHideNodeTooltip,
}: NodesProps) {
    const {withProblems} = useWithProblemsQueryParam();

    const displayedNodesCount = React.useMemo(
        () => countDisplayedNodes(nodes, withProblems, isRight, showRacks),
        [nodes, withProblems, isRight, showRacks],
    );

    const result = Object.keys(nodes).map((nodeTypeKey, j) => {
        const nodesGroupedByRack = groupNodesByField(nodes[nodeTypeKey], 'Rack');
        return (
            <div key={j} className={b('nodes-container', {right: isRight})}>
                <div className={b('nodes-title')}>{i18n('label_nodes', {type: nodeTypeKey})}</div>
                <div className={b('nodes')}>
                    {showRacks ? (
                        Object.keys(nodesGroupedByRack).map((rackKey, i) => (
                            <RackColumn
                                key={i}
                                rackKey={rackKey}
                                rackIndex={i}
                                nodes={nodesGroupedByRack[rackKey]}
                                isRight={isRight}
                                showId={showId}
                                clickedNode={clickedNode}
                                withProblems={withProblems}
                                onClickNode={onClickNode}
                                onShowNodeTooltip={onShowNodeTooltip}
                                onHideNodeTooltip={onHideNodeTooltip}
                            />
                        ))
                    ) : (
                        <FlatNodesList
                            nodes={nodes[nodeTypeKey]}
                            isRight={isRight}
                            showId={showId}
                            clickedNode={clickedNode}
                            withProblems={withProblems}
                            onClickNode={onClickNode}
                            onShowNodeTooltip={onShowNodeTooltip}
                            onHideNodeTooltip={onHideNodeTooltip}
                        />
                    )}
                </div>
            </div>
        );
    });

    if (withProblems && displayedNodesCount === 0) {
        return <Illustration name="thumbsUp" width={200} />;
    }

    return result;
}
