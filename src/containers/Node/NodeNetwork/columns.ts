import DataTable from '@gravity-ui/react-data-table';

import {
    getHostColumn,
    getNodeIdColumn,
    getNodeNameColumn,
    getPeerPingColumn,
    getPeerSkewColumn,
    getPileNameColumn,
    getReceiveThroughputColumn,
    getSendThroughputColumn,
} from '../../../components/nodesColumns/columns';
import {isSortableNodesColumn} from '../../../components/nodesColumns/constants';
import type {GetNodesColumnsParams} from '../../../components/nodesColumns/types';
import {EMPTY_DATA_PLACEHOLDER} from '../../../lib';
import {formatDateTime} from '../../../utils/dataFormatters/dataFormatters';
import type {Column} from '../../../utils/tableUtils/types';
import {bytesToMB, isNumeric} from '../../../utils/utils';

import {NODE_NETWORK_COLUMNS_IDS, NODE_NETWORK_COLUMNS_TITLES} from './constants';
import type {NodePeerRow} from './helpers/nodeNetworkMapper';

function getPeerConnectTimeColumn<T extends {ConnectTime?: string}>(): Column<T> {
    return {
        name: NODE_NETWORK_COLUMNS_IDS.ConnectTime,
        header: NODE_NETWORK_COLUMNS_TITLES.ConnectTime,
        align: DataTable.LEFT,
        width: 150,
        resizeMinWidth: 120,
        render: ({row}) =>
            row.ConnectTime ? formatDateTime(row.ConnectTime) : EMPTY_DATA_PLACEHOLDER,
    };
}

function getPeerSentBytesColumn<T extends {SentBytes?: string | number}>(): Column<T> {
    return {
        name: NODE_NETWORK_COLUMNS_IDS.SentBytes,
        header: NODE_NETWORK_COLUMNS_TITLES.SentBytes,
        align: DataTable.RIGHT,
        width: 140,
        resizeMinWidth: 120,
        render: ({row}) =>
            isNumeric(row.SentBytes) ? bytesToMB(row.SentBytes) : EMPTY_DATA_PLACEHOLDER,
    };
}

function getPeerReceivedBytesColumn<T extends {ReceivedBytes?: string | number}>(): Column<T> {
    return {
        name: NODE_NETWORK_COLUMNS_IDS.ReceivedBytes,
        header: NODE_NETWORK_COLUMNS_TITLES.ReceivedBytes,
        align: DataTable.RIGHT,
        width: 160,
        resizeMinWidth: 130,
        render: ({row}) =>
            isNumeric(row.ReceivedBytes) ? bytesToMB(row.ReceivedBytes) : EMPTY_DATA_PLACEHOLDER,
    };
}

export function getNodeNetworkColumns(params: GetNodesColumnsParams = {}): Column<NodePeerRow>[] {
    const cols: Column<NodePeerRow>[] = [
        getNodeIdColumn(),
        getNodeNameColumn(),
        getPileNameColumn(),
        getHostColumn(params),
        getPeerConnectTimeColumn(),
        getPeerSkewColumn(),
        getPeerPingColumn(),
        getSendThroughputColumn(),
        getPeerSentBytesColumn(),
        getReceiveThroughputColumn(),
        getPeerReceivedBytesColumn(),
    ];

    return cols.map((column) => {
        const name = column.name;

        const sortablePeerColumn = name === 'SentBytes' || name === 'ReceivedBytes';

        return {
            ...column,
            sortable: isSortableNodesColumn(name) || sortablePeerColumn,
        };
    });
}
