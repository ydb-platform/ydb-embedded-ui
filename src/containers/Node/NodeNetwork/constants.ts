import {NODES_COLUMNS_IDS, NODES_COLUMNS_TITLES} from '../../../components/nodesColumns/constants';
import type {PeersSortValue} from '../../../types/api/peers';
import type {ValueOf} from '../../../types/common';

import i18n from './i18n';

export const NODE_NETWORK_TABLE_SELECTED_COLUMNS_KEY = 'nodeNetworkTableSelectedColumns';

export const NODE_NETWORK_COLUMNS_WIDTH_LS_KEY = 'nodeNetworkTableColumnsWidth';

export const NODE_NETWORK_COLUMNS_IDS = {
    NodeId: NODES_COLUMNS_IDS.NodeId,
    Host: NODES_COLUMNS_IDS.Host,
    NodeName: NODES_COLUMNS_IDS.NodeName,
    PileName: NODES_COLUMNS_IDS.PileName,
    ClockSkew: NODES_COLUMNS_IDS.ClockSkew,
    PingTime: NODES_COLUMNS_IDS.PingTime,
    SendThroughput: NODES_COLUMNS_IDS.SendThroughput,
    ReceiveThroughput: NODES_COLUMNS_IDS.ReceiveThroughput,

    ConnectTime: 'ConnectTime',
    BytesSend: 'BytesSend',
    BytesReceived: 'BytesReceived',
} as const;

export type NodeNetworkColumnId = ValueOf<typeof NODE_NETWORK_COLUMNS_IDS>;

export const NODE_NETWORK_DEFAULT_COLUMNS: NodeNetworkColumnId[] = [
    'NodeId',
    'Host',
    'ClockSkew',
    'PingTime',
    'SendThroughput',
    'ReceiveThroughput',
];

export const NODE_NETWORK_REQUIRED_COLUMNS: NodeNetworkColumnId[] = ['NodeId', 'Host'];

export const NODE_NETWORK_COLUMNS_TITLES = {
    NodeId: NODES_COLUMNS_TITLES.NodeId,
    Host: NODES_COLUMNS_TITLES.Host,
    NodeName: NODES_COLUMNS_TITLES.NodeName,
    PileName: NODES_COLUMNS_TITLES.PileName,
    ClockSkew: NODES_COLUMNS_TITLES.ClockSkew,
    PingTime: NODES_COLUMNS_TITLES.PingTime,
    SendThroughput: NODES_COLUMNS_TITLES.SendThroughput,
    ReceiveThroughput: NODES_COLUMNS_TITLES.ReceiveThroughput,

    ConnectTime: i18n('field_connect-time'),
    BytesSend: i18n('field_sent-bytes'),
    BytesReceived: i18n('field_received-bytes'),
} as const satisfies Record<NodeNetworkColumnId, string>;

export const NODE_NETWORK_COLUMNS_TO_SORT_FIELDS: Partial<
    Record<NodeNetworkColumnId, PeersSortValue>
> = {
    NodeId: 'PeerId',
    Host: 'PeerName',
    PileName: 'PileName',
    ClockSkew: 'ClockSkew',
    PingTime: 'PingTime',
    BytesSend: 'BytesSend',
    BytesReceived: 'BytesReceived',
};

export function getNodeNetworkColumnSortField(columnId?: string) {
    if (!columnId) {
        return undefined;
    }

    return NODE_NETWORK_COLUMNS_TO_SORT_FIELDS[columnId as NodeNetworkColumnId];
}

export function isSortableNodeNetworkColumn(columnId: string): boolean {
    return Boolean(getNodeNetworkColumnSortField(columnId));
}
