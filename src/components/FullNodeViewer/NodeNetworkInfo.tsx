import {getDefaultNodePath} from '../../containers/Node/NodePages';
import type {TNodeInfo} from '../../types/api/nodes';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {InfoViewer} from '../InfoViewer/InfoViewer';
import type {InfoViewerItem} from '../InfoViewer/InfoViewer';
import {InternalLink} from '../InternalLink';

import i18n from './i18n';

interface NodeNetworkInfoProps {
    nodeNetworkInfo?: TNodeInfo | null;
    className?: string;
    database?: string;
}

export const NodeNetworkInfo = ({nodeNetworkInfo, className, database}: NodeNetworkInfoProps) => {
    const peers = nodeNetworkInfo?.Peers;

    if (!peers || peers.length === 0) {
        return null;
    }

    const connectedPeers = peers.filter((peer) => peer.Connected);
    const totalPeers = peers.length;

    const networkInfo: InfoViewerItem[] = [
        {
            label: i18n('network.total-peers'),
            value: totalPeers,
        },
        {
            label: i18n('network.connected-peers'),
            value: connectedPeers.length,
        },
    ];

    // Show up to 5 peers in the info section
    const displayPeers = peers.slice(0, 5);

    displayPeers.forEach((peer, index) => {
        const nodeLink = peer.NodeId ? (
            <InternalLink to={getDefaultNodePath(peer.NodeId, {database})}>
                {peer.NodeId}
            </InternalLink>
        ) : (
            EMPTY_DATA_PLACEHOLDER
        );

        networkInfo.push({
            label: `${i18n('network.peer-node-id')} ${index + 1}`,
            value: nodeLink,
        });
    });

    return <InfoViewer title={i18n('title.network')} className={className} info={networkInfo} />;
};
