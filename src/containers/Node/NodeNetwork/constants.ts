import {NODES_COLUMNS_IDS, NODES_COLUMNS_TITLES} from '../../../components/nodesColumns/constants';

import i18n from './i18n';

export const NODE_NETWORK_TABLE_SELECTED_COLUMNS_KEY = 'nodeNetworkTableSelectedColumns';

export const NODE_NETWORK_COLUMNS_WIDTH_LS_KEY = 'nodeNetworkTableColumnsWidth';

export const NODE_NETWORK_COLUMNS_IDS = {
    ...NODES_COLUMNS_IDS,
    ConnectTime: 'ConnectTime',
    SentBytes: 'SentBytes',
    ReceivedBytes: 'ReceivedBytes',
};

export const NODE_NETWORK_DEFAULT_COLUMNS: string[] = [
    'NodeId',
    'Host',
    'ClockSkew',
    'PingTime',
    'SendThroughput',
    'ReceiveThroughput',
];

export const NODE_NETWORK_REQUIRED_COLUMNS: string[] = ['NodeId', 'Host'];

export const NODE_NETWORK_COLUMNS_TITLES: Record<string, string> = {
    ...NODES_COLUMNS_TITLES,

    get ConnectTime() {
        return i18n('field_connect-time');
    },
    get SentBytes() {
        return i18n('field_sent-bytes');
    },
    get ReceivedBytes() {
        return i18n('field_received-bytes');
    },
};
